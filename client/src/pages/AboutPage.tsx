import { Link } from 'react-router-dom';
import {
  BadgeCheck,
  Building2,
  Handshake,
  Leaf,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Sprout,
  Tractor,
  Users,
  Wallet,
} from 'lucide-react';
import { buttonClass } from '../components/ui/Button';
import { Card, PageHeader, SectionHead } from '../components/ui/Surfaces';

const faqs = [
  {
    question: 'هل التسجيل في فُرصة مجاني؟',
    answer:
      'نعم، التسجيل والنشر ضمن الخطة المجانية متاح دون مقابل، مع حد أقصى للإعلانات الشهرية. يمكنك الترقية إلى الخطة المهنية عند الحاجة إلى حد نشر أعلى.',
  },
  {
    question: 'كيف أضمن أن الطرف الآخر موثوق؟',
    answer:
      'نطلب تأكيد رقم الهاتف لكل حساب قبل التفعيل. ننصح دائماً بالتواصل عبر المنصة، والتحقق من المنتج قبل الدفع، وعدم مشاركة البيانات البنكية.',
  },
  {
    question: 'ما الفرق بين عرض البيع وطلب الشراء؟',
    answer:
      'عرض البيع ينشره من لديه منتج أو خدمة للبيع. طلب الشراء ينشره من يبحث عن كمية محددة، ويمكن للتجار والمزارعين تقديم عروضهم على الطلب.',
  },
  {
    question: 'هل يمكنني نشر أكثر من إعلان؟',
    answer:
      'نعم، حسب خطتك الشهرية. الخطة المجانية تتيح 5 إعلانات شهرياً، والخطة المهنية تتيح 50 إعلاناً شهرياً. يمكنك متابعة استهلاكك من صفحة الاشتراك.',
  },
  {
    question: 'هل تدعم المنصة جميع محافظات الأردن؟',
    answer:
      'نعم، يمكنك تحديد المحافظة والمنطقة عند نشر الإعلان، وتظهر التغطية لجميع محافظات المملكة الاثنتي عشرة.',
  },
  {
    question: 'كيف أتواصل مع ناشر الإعلان؟',
    answer:
      'يمكنك إرسال رسالة داخلية إذا كان الناشر قد فعّل الرسائل، أو الاتصال أو مراسلة واتساب إذا اختار إظهار رقمه. تظهر خيارات التواصل المتاحة في صفحة الإعلان.',
  },
];

export function AboutPage() {
  return (
    <div>
      <section className="hero" style={{ borderRadius: '0 0 var(--radius-lg) var(--radius-lg)' }}>
        <div className="container" style={{ position: 'relative', zIndex: 1, paddingBlock: 'clamp(2.5rem, 6vw, 4.5rem)' }}>
          <span className="eyebrow" style={{ background: 'rgba(255,255,255,0.14)', color: '#fff', borderColor: 'rgba(255,255,255,0.22)' }}>
            <Leaf size={15} /> عن منصة فُرصة
          </span>
          <h1 className="mt-3" style={{ maxWidth: '20ch' }}>
            نبني جسراً رقمياً بين الحقل والسوق.
          </h1>
          <p style={{ color: '#d7e6d3', maxWidth: '58ch', marginTop: '1rem', fontSize: '1.05rem' }}>
            فُرصة منصة أردنية تجمع المزارعين والتجار ومقدمي الخدمات الزراعية في مكان واحد، لتسهيل عرض المنتجات
            والوصول إلى فرص البيع والشراء ببيانات واضحة وتواصل مباشر.
          </p>
          <div className="row wrap mt-4">
            <Link to="/market" className={buttonClass('gold')}>
              تصفح السوق
            </Link>
            <Link to="/register" className="btn btn-secondary">
              انضم إلى المنصة
            </Link>
          </div>
        </div>
      </section>

      <div className="container">
        <section className="section">
          <div className="grid grid-2" style={{ alignItems: 'center' }}>
            <div className="stack-sm">
              <span className="eyebrow" style={{ width: 'fit-content' }}>
                <Sprout size={15} /> لماذا فُرصة؟
              </span>
              <h2>سوق زراعي يفهم احتياجات القطاع.</h2>
              <p className="muted">
                في كثير من الأحيان يجد المزارع صعوبة في الوصول إلى المشتري المناسب، ويجد التاجر صعوبة في معرفة من
                يوفّر الكمية المطلوبة. تعمل فُرصة على تقليل هذه الفجوة عبر إعلانات منظمة، وفلاتر دقيقة، وقنوات
                تواصل واضحة.
              </p>
              <ul className="spec-list">
                <li>
                  <span className="k">للمزارع</span>
                  <span className="v">اعرض محصولك ووصل إلى تجار ومصانع</span>
                </li>
                <li>
                  <span className="k">للتاجر</span>
                  <span className="v">انشر طلب شراء واستقبل عروضاً متعددة</span>
                </li>
                <li>
                  <span className="k">لمقدم الخدمة</span>
                  <span className="v">سوّق خدمات النقل والمستلزمات الزراعية</span>
                </li>
              </ul>
            </div>
            <div className="grid grid-2">
              <Card pad className="stack-sm">
                <span className="tile-icon">
                  <Tractor size={20} />
                </span>
                <h3>قطاع زراعي</h3>
                <p className="small muted">محاصيل، خضروات، فواكه، مستلزمات وخدمات في تصنيفات منظمة.</p>
              </Card>
              <Card pad className="stack-sm">
                <span className="tile-icon">
                  <MapPin size={20} />
                </span>
                <h3>تغطية محلية</h3>
                <p className="small muted">فلترة حسب المحافظة والمنطقة للوصول إلى الأقرب جغرافياً.</p>
              </Card>
              <Card pad className="stack-sm">
                <span className="tile-icon">
                  <ShieldCheck size={20} />
                </span>
                <h3>حسابات موثّقة</h3>
                <p className="small muted">تأكيد رقم الهاتف قبل التفعيل، وإعدادات خصوصية للتواصل.</p>
              </Card>
              <Card pad className="stack-sm">
                <span className="tile-icon">
                  <Handshake size={20} />
                </span>
                <h3>تفاوض مباشر</h3>
                <p className="small muted">عروض أسعار وكميات، ومحادثات داخلية لمتابعة التفاصيل.</p>
              </Card>
            </div>
          </div>
        </section>

        <section className="section" id="how">
          <SectionHead title="كيف تعمل المنصة؟" description="من التسجيل إلى إتمام الصفقة، خطوات واضحة وبسيطة." />
          <div className="grid grid-3">
            <Card pad className="stack-sm">
              <span className="badge badge-gold" style={{ width: 'fit-content' }}>
                الخطوة 1
              </span>
              <Users size={22} />
              <h3>سجّل ووثّق رقمك</h3>
              <p className="small muted">
                أنشئ حسابك وحدد تخصصك ونشاطك، ثم أدخل رمز التحقق الذي يصلك على هاتفك لتفعيل الحساب.
              </p>
            </Card>
            <Card pad className="stack-sm">
              <span className="badge badge-gold" style={{ width: 'fit-content' }}>
                الخطوة 2
              </span>
              <Leaf size={22} />
              <h3>انشر أو ابحث</h3>
              <p className="small muted">
                أضف عرض بيع أو طلب شراء مع الكمية والوحدة والسعر والمحافظة، أو تصفح السوق وفلتر النتائج.
              </p>
            </Card>
            <Card pad className="stack-sm">
              <span className="badge badge-gold" style={{ width: 'fit-content' }}>
                الخطوة 3
              </span>
              <MessageSquare size={22} />
              <h3>تواصل وأتمم</h3>
              <p className="small muted">
                أرسل رسالة أو قدّم عرضاً على طلب شراء، وتابع حالة العرض حتى الوصول إلى اتفاق.
              </p>
            </Card>
          </div>
        </section>

        <section className="section">
          <SectionHead
            title="خطط تناسب حجم نشاطك"
            description="ابدأ مجاناً، وارتقِ عندما تحتاج إلى مساحة أكبر."
            action={
              <Link to="/subscription" className="btn btn-sm btn-secondary">
                عرض الخطط
              </Link>
            }
          />
          <div className="grid grid-3">
            <Card pad className="stack-sm">
              <Wallet size={22} />
              <h3>خطة مجانية</h3>
              <p className="muted small">مناسبة للتجربة والاستخدام الشخصي، مع حد نشر شهري أساسي.</p>
            </Card>
            <Card pad className="stack-sm">
              <BadgeCheck size={22} />
              <h3>خطة مهنية</h3>
              <p className="muted small">لمن ينشر بانتظام ويحتاج إلى حد إعلانات أعلى ومزايا إضافية.</p>
            </Card>
            <Card pad className="stack-sm">
              <Building2 size={22} />
              <h3>للمؤسسات</h3>
              <p className="muted small">تواصل معنا لمناقشة احتياجات الفرق والمصانع وشركات التوزيع.</p>
            </Card>
          </div>
        </section>

        <section className="section" id="faq">
          <SectionHead title="الأسئلة الشائعة" description="إجابات سريعة عن أكثر ما يسأل عنه المستخدمون." />
          <div className="stack-sm">
            {faqs.map((faq) => (
              <details key={faq.question} className="card card-pad">
                <summary className="strong" style={{ cursor: 'pointer' }}>
                  {faq.question}
                </summary>
                <p className="muted mt-2">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="section" id="terms">
          <SectionHead title="الشروط والأحكام" description="ملخص الشروط الأساسية لاستخدام المنصة." />
          <Card pad>
            <ul className="stack-sm muted" style={{ paddingInlineStart: '1.1rem', fontSize: '0.92rem' }}>
              <li>يجب أن تكون البيانات المسجلة صحيحة، وأن يكون رقم الهاتف مملوكاً لك.</li>
              <li>يُمنع نشر إعلانات وهمية أو مكررة أو مخالفة للقوانين الأردنية.</li>
              <li>المستخدم مسؤول عن دقة وصف المنتج والكمية والسعر المعروض.</li>
              <li>المنصة وسيط تقني للتواصل، ولا تضمن جودة المنتج أو إتمام الصفقة بين الأطراف.</li>
              <li>يحق للإدارة إيقاف أي حساب أو إعلان يخالف الشروط أو يسيء استخدام المنصة.</li>
              <li>الاشتراكات المدفوعة لا تُرد بعد تفعيلها، ما لم ينص القانون على خلاف ذلك.</li>
            </ul>
          </Card>
        </section>

        <section className="section" id="privacy">
          <SectionHead title="سياسة الخصوصية" description="كيف نتعامل مع بياناتك." />
          <Card pad>
            <ul className="stack-sm muted" style={{ paddingInlineStart: '1.1rem', fontSize: '0.92rem' }}>
              <li>نجمع البيانات اللازمة لإنشاء الحساب وتشغيل السوق: الاسم، الهاتف، النشاط، والموقع التقريبي.</li>
              <li>لا نبيع بياناتك الشخصية لأي طرف ثالث.</li>
              <li>يمكنك التحكم بإظهار رقم هاتفك وقنوات التواصل من إعدادات الملف الشخصي.</li>
              <li>كلمات المرور تُخزَّن مشفّرة، ولا يمكن لأي موظف الاطلاع عليها.</li>
              <li>قد نستخدم بيانات الاستخدام لتحسين المنصة وحماية الحسابات من إساءة الاستخدام.</li>
            </ul>
          </Card>
        </section>

        <section className="section">
          <Card pad className="between" style={{ gap: '1.25rem' }}>
            <div>
              <h2 style={{ fontSize: '1.35rem' }}>هل لديك سؤال آخر؟</h2>
              <p className="muted small mt-1">فريق فُرصة جاهز للمساعدة عبر قنوات التواصل الرسمية.</p>
            </div>
            <div className="row wrap">
              <a href="tel:0790000000" className={buttonClass('secondary')}>
                اتصل بنا
              </a>
              <a href="mailto:info@fursa.jo" className={buttonClass()}>
                راسلنا
              </a>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}
