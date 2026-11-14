import { getDb, query, queryOne, execute, withTransaction } from '../../db';
import { badRequest } from '../../lib/ApiError';
import { logAudit } from '../../lib/auth';
import { assertUserPermission } from '../../lib/permissions';

export const FREE_PLAN_NAME = 'free';

export interface EffectiveSubscription {
  id: number;
  planId: number;
  planName: string;
  price: number;
  monthlyPostLimit: number;
  status: string;
  startsAt: number;
  endsAt: number;
}

interface PlanRow {
  id: number;
  name: string;
  price: number;
  monthly_post_limit: number;
  duration_days: number;
  is_active: number;
}

function toPublicPlan(plan: PlanRow) {
  return {
    id: plan.id,
    name: plan.name,
    price: plan.price,
    monthlyPostLimit: plan.monthly_post_limit,
    durationDays: plan.duration_days,
    isActive: plan.is_active === 1,
  };
}

export async function getPlanByName(name: string) {
  return await queryOne<PlanRow>(
    'SELECT id, name, price, monthly_post_limit, duration_days, is_active FROM plans WHERE name = ?',
    [name],
  );
}

export async function getFreePlan() {
  const plan = await getPlanByName(FREE_PLAN_NAME);
  if (!plan) throw new Error('FREE_PLAN_MISSING');
  return plan;
}

export async function getEffectiveSubscription(userId: number, nowSec: number): Promise<EffectiveSubscription> {
  const subscription = await queryOne<{ id: number; plan_id: number; status: string; starts_at: number; ends_at: number }>(
    'SELECT id, plan_id, status, starts_at, ends_at FROM subscriptions WHERE user_id = ? AND status = ? AND ends_at > ? ORDER BY ends_at DESC LIMIT 1',
    [userId, 'active', nowSec],
  );
  const freePlan = await getFreePlan();
  if (subscription) {
    const plan = await queryOne<PlanRow>(
      'SELECT id, name, price, monthly_post_limit, duration_days, is_active FROM plans WHERE id = ?',
      [subscription.plan_id],
    );
    if (plan) {
      return {
        id: subscription.id,
        planId: plan.id,
        planName: plan.name,
        price: plan.price,
        monthlyPostLimit: plan.monthly_post_limit,
        status: subscription.status,
        startsAt: subscription.starts_at,
        endsAt: subscription.ends_at,
      };
    }
  }
  return {
    id: 0,
    planId: freePlan.id,
    planName: freePlan.name,
    price: freePlan.price,
    monthlyPostLimit: freePlan.monthly_post_limit,
    status: 'active',
    startsAt: 0,
    endsAt: 0,
  };
}

export async function getPostUsage(userId: number, billingPeriodStart: number, monthlyPostLimit: number) {
  const row = await queryOne<{ used_posts: number }>(
    'SELECT used_posts FROM post_usage WHERE user_id = ? AND billing_period_start = ?',
    [userId, billingPeriodStart],
  );
  const used = row?.used_posts ?? 0;
  return { usedPosts: used, remainingPosts: Math.max(0, monthlyPostLimit - used), monthlyPostLimit };
}

export async function canPublish(userId: number, nowSec: number) {
  const subscription = await getEffectiveSubscription(userId, nowSec);
  const periodStart = Math.floor(nowSec / (30 * 24 * 3600)) * (30 * 24 * 3600);
  const usage = await getPostUsage(userId, periodStart, subscription.monthlyPostLimit);
  return { allowed: usage.remainingPosts > 0, subscription, usage };
}

export async function recordPublish(userId: number, nowSec: number) {
  const subscription = await getEffectiveSubscription(userId, nowSec);
  const periodStart = Math.floor(nowSec / (30 * 24 * 3600)) * (30 * 24 * 3600);
  const periodEnd = periodStart + 30 * 24 * 3600;
  return withTransaction(async () => {
    const existing = await queryOne<{ id: number }>(
      'SELECT id FROM post_usage WHERE user_id = ? AND billing_period_start = ?',
      [userId, periodStart],
    );
    if (existing) {
      await execute('UPDATE post_usage SET used_posts = used_posts + 1 WHERE id = ?', [existing.id]);
    } else {
      await execute(
        'INSERT INTO post_usage (user_id, subscription_id, billing_period_start, billing_period_end, monthly_post_limit, used_posts) VALUES (?, ?, ?, ?, ?, 1)',
        [userId, subscription.id > 0 ? subscription.id : null, periodStart, periodEnd, subscription.monthlyPostLimit],
      );
    }
    return true;
  });
}

export async function listPlans() {
  const rows = await query<PlanRow>('SELECT id, name, price, monthly_post_limit, duration_days, is_active FROM plans WHERE is_active = 1 ORDER BY price ASC');
  return rows.map(toPublicPlan);
}

export async function getMySubscription(userId: number) {
  const nowSec = Math.floor(Date.now() / 1000);
  const subscription = await getEffectiveSubscription(userId, nowSec);
  const plan = await queryOne<PlanRow>(
    'SELECT id, name, price, monthly_post_limit, duration_days, is_active FROM plans WHERE id = ?',
    [subscription.planId],
  );
  const periodStart = Math.floor(nowSec / (30 * 24 * 3600)) * (30 * 24 * 3600);
  const usage = await getPostUsage(userId, periodStart, subscription.monthlyPostLimit);
  const freePlan = await getFreePlan();
  return {
    subscription,
    plan: plan ? toPublicPlan(plan) : null,
    freePlan: toPublicPlan(freePlan),
    usage,
    paymentGatewayConfigured: Boolean(process.env.PAYMENT_PROVIDER),
  };
}

export async function createCheckout(userId: number, planId: number) {
  await assertUserPermission(userId, 'subscriptions.manage');
  if (!Number.isInteger(planId) || planId <= 0) {
    throw badRequest('INVALID_PLAN', 'Please choose a valid plan');
  }
  const plan = await queryOne<PlanRow>(
    'SELECT id, name, price, monthly_post_limit, duration_days, is_active FROM plans WHERE id = ?',
    [planId],
  );
  if (!plan || plan.is_active !== 1) {
    throw badRequest('PLAN_NOT_FOUND', 'Plan not found');
  }
  if (plan.price <= 0) {
    throw badRequest('PLAN_NOT_PURCHASABLE', 'The free plan does not require a payment');
  }

  const gateway = process.env.PAYMENT_PROVIDER;
  if (!gateway) {
    return {
      available: false,
      message: 'Online payments are currently unavailable. Please contact support to activate the professional plan manually.',
      plan: toPublicPlan(plan),
    };
  }

  const now = Math.floor(Date.now() / 1000);
  const endsAt = now + plan.duration_days * 24 * 3600;
  const periodStart = Math.floor(now / (30 * 24 * 3600)) * (30 * 24 * 3600);
  const periodEnd = periodStart + 30 * 24 * 3600;

  const result = await withTransaction(async () => {
    const paymentInfo = await execute(
      'INSERT INTO payments (user_id, subscription_id, amount, currency, provider, provider_reference, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, null, plan.price, 'JOD', gateway, `MOCK-${Date.now()}`, 'succeeded', now],
    );
    const paymentId = Number(paymentInfo.lastInsertRowid);

    await execute('UPDATE subscriptions SET status = ?, auto_renew = 0, updated_at = ? WHERE user_id = ? AND status = ?', [
      'expired',
      now,
      userId,
      'active',
    ]);

    const subscriptionInfo = await execute(
      `INSERT INTO subscriptions (user_id, plan_id, status, starts_at, ends_at, auto_renew, payment_provider_reference, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?)`,
      [userId, plan.id, 'active', now, endsAt, `PAY-${paymentId}`, now, now],
    );
    const subscriptionId = Number(subscriptionInfo.lastInsertRowid);

    await execute('UPDATE payments SET subscription_id = ? WHERE id = ?', [subscriptionId, paymentId]);

    const usage = await queryOne<{ id: number }>('SELECT id FROM post_usage WHERE user_id = ? AND billing_period_start = ?', [
      userId,
      periodStart,
    ]);
    if (usage) {
      await execute('UPDATE post_usage SET subscription_id = ?, billing_period_end = ?, monthly_post_limit = ? WHERE id = ?', [
        subscriptionId,
        periodEnd,
        plan.monthly_post_limit,
        usage.id,
      ]);
    } else {
      await execute(
        'INSERT INTO post_usage (user_id, subscription_id, billing_period_start, billing_period_end, monthly_post_limit, used_posts) VALUES (?, ?, ?, ?, ?, 0)',
        [userId, subscriptionId, periodStart, periodEnd, plan.monthly_post_limit],
      );
    }

    logAudit(userId, 'SUBSCRIPTION_PURCHASED', 'subscription', subscriptionId, { planId: plan.id, price: plan.price });

    return { paymentId, subscriptionId };
  });

  return {
    available: true,
    paymentId: result.paymentId,
    subscriptionId: result.subscriptionId,
    providerReference: `PAY-${result.paymentId}`,
    plan: toPublicPlan(plan),
  };
}

export async function cancelSubscription(userId: number) {
  const db = getDb();
  const subscription = await queryOne<{ id: number; status: string; auto_renew: number; ends_at: number }>(
    'SELECT id, status, auto_renew, ends_at FROM subscriptions WHERE user_id = ? AND status = ? ORDER BY ends_at DESC LIMIT 1',
    [userId, 'active'],
  );
  const freePlan = await getFreePlan();
  if (!subscription) {
    return { canceled: false, planName: freePlan.name, endsAt: null };
  }
  await execute('UPDATE subscriptions SET auto_renew = 0, status = ?, updated_at = ? WHERE id = ?', ['canceled',
    Math.floor(Date.now() / 1000),
    subscription.id,]);
  logAudit(userId, 'SUBSCRIPTION_CANCELED', 'subscription', subscription.id);
  return { canceled: true, planName: freePlan.name, endsAt: subscription.ends_at };
}
