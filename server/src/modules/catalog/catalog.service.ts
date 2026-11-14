import { getDb, query, queryOne } from '../../db';

export interface CategoryNode {
  id: number;
  name: string;
  parentId: number | null;
  isActive: boolean;
  children: CategoryNode[];
}

export async function listCategories(): Promise<CategoryNode[]> {
  const rows = await query<{ id: number; name: string; parent_id: number | null; is_active: number }>(
    'SELECT id, name, parent_id, is_active FROM categories WHERE is_active = 1 ORDER BY parent_id ASC, id ASC',
  );
  const nodes: CategoryNode[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    parentId: row.parent_id,
    isActive: row.is_active === 1,
    children: [],
  }));
  const parents = new Map<number, CategoryNode>();
  const roots: CategoryNode[] = [];
  for (const node of nodes) {
    parents.set(node.id, node);
    if (node.parentId === null) roots.push(node);
  }
  for (const node of nodes) {
    const parent = node.parentId === null ? undefined : parents.get(node.parentId);
    if (parent) parent.children.push(node);
  }
  return roots;
}

export async function listUnits() {
  const rows = await query<{ id: number; name: string; abbreviation: string }>(
    'SELECT id, name, abbreviation FROM units ORDER BY id ASC',
  );
  return rows;
}

export async function listSpecialties() {
  const rows = await query<{
    id: number;
    name: string;
    code: string | null;
    name_en: string | null;
    description: string | null;
    icon: string | null;
    is_active: number;
  }>(
    'SELECT id, name, code, name_en, description, icon, is_active FROM specialties ORDER BY id ASC',
  );
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    code: row.code,
    nameEn: row.name_en,
    description: row.description,
    icon: row.icon,
    isActive: row.is_active === 1,
  }));
}

export async function listGovernorates() {
  const rows = await query<{ id: number; name_ar: string; name_en: string; is_active: number }>(
    'SELECT id, name_ar, name_en, is_active FROM governorates ORDER BY id ASC',
  );
  return rows.map((row) => ({
    id: row.id,
    nameAr: row.name_ar,
    nameEn: row.name_en,
    isActive: row.is_active === 1,
  }));
}
