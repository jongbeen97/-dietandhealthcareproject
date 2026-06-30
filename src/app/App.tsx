import { useState, useEffect, useCallback } from "react";
import {
  Droplets,
  CheckSquare,
  Home,
  Calculator,
  ClipboardList,
  Newspaper,
  ChevronRight,
  Plus,
  Minus,
  RotateCcw,
  ArrowRight,
  Zap,
  Target,
  Users,
  Sparkles,
  Activity,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Page = "home" | "calculator" | "checklist" | "board";
type Gender = "male" | "female";
type DietTypeKey = "A" | "B" | "C" | "D";

interface TrackerState {
  water: number;
  meals: { breakfast: boolean; lunch: boolean; dinner: boolean };
  exercise: { cardio: boolean; strength: boolean; stretch: boolean };
}

interface QuizAnswer {
  questionId: number;
  scoreA: number;
  scoreB: number;
  scoreC: number;
  scoreD: number;
}

// ─── Static Data ──────────────────────────────────────────────────────────────
const NAVER_FORM_URL = "https://naver.me/5l2VUHzN";

const QUIZ_QUESTIONS = [
  {
    id: 1,
    question: "하루 식사 횟수가 주로 어느 정도인가요?",
    options: [
      { label: "1끼 이하 (자주 굶어요)", scores: { A: 1, B: 1, C: 3, D: 0 } },
      { label: "2끼 (아침 또는 저녁 skip)", scores: { A: 1, B: 2, C: 2, D: 0 } },
      { label: "3끼 규칙적으로", scores: { A: 1, B: 0, C: 0, D: 3 } },
      { label: "4끼 이상 (간식 포함)", scores: { A: 3, B: 0, C: 1, D: 1 } },
    ],
  },
  {
    id: 2,
    question: "주로 어떤 음식을 즐겨 먹나요?",
    options: [
      { label: "밥, 빵, 면류 위주", scores: { A: 3, B: 1, C: 1, D: 0 } },
      { label: "고기, 생선, 달걀 위주", scores: { A: 0, B: 0, C: 0, D: 2 } },
      { label: "배달 음식, 편의점 식품", scores: { A: 2, B: 2, C: 2, D: 0 } },
      { label: "채소, 샐러드 위주", scores: { A: 0, B: 3, C: 0, D: 2 } },
    ],
  },
  {
    id: 3,
    question: "운동 후 식사 습관은 어떤가요?",
    options: [
      { label: "운동을 거의 안 해요", scores: { A: 1, B: 1, C: 2, D: 0 } },
      { label: "운동 후 아무것도 안 먹어요", scores: { A: 0, B: 3, C: 1, D: 0 } },
      { label: "운동 후 탄수화물 위주로 먹어요", scores: { A: 3, B: 1, C: 0, D: 0 } },
      { label: "운동 후 단백질을 챙겨요", scores: { A: 0, B: 0, C: 0, D: 3 } },
    ],
  },
  {
    id: 4,
    question: "야식이나 늦은 저녁 식사를 하는 편인가요?",
    options: [
      { label: "거의 매일 (밤 11시 이후)", scores: { A: 2, B: 0, C: 2, D: 0 } },
      { label: "주 3~4회", scores: { A: 2, B: 0, C: 1, D: 0 } },
      { label: "주 1~2회", scores: { A: 1, B: 0, C: 1, D: 1 } },
      { label: "거의 안 해요", scores: { A: 0, B: 0, C: 0, D: 3 } },
    ],
  },
  {
    id: 5,
    question: "평소 단백질 식품을 의식적으로 챙기나요?",
    options: [
      { label: "전혀 신경 안 써요", scores: { A: 1, B: 3, C: 1, D: 0 } },
      { label: "가끔 생각날 때만", scores: { A: 1, B: 2, C: 1, D: 0 } },
      { label: "식사마다 조금씩 챙겨요", scores: { A: 0, B: 0, C: 0, D: 2 } },
      { label: "매 끼니 의식적으로 챙겨요", scores: { A: 0, B: 0, C: 0, D: 3 } },
    ],
  },
];

const DIET_TYPES: Record<DietTypeKey, { name: string; emoji: string; description: string; tips: string[]; color: string; bg: string }> = {
  A: {
    name: "탄수화물 과잉형",
    emoji: "🍚",
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.12)",
    description: "탄수화물 섭취가 과도하여 혈당 스파이크와 체지방 축적이 우려됩니다. 단백질과 식이섬유 비중을 높이는 균형 잡힌 식단이 필요해요.",
    tips: ["흰쌀밥 대신 잡곡밥 선택하기", "식사 전 채소와 단백질 먼저 섭취", "간식으로 견과류·달걀 활용"],
  },
  B: {
    name: "단백질 부족형",
    emoji: "🥩",
    color: "#EF4444",
    bg: "rgba(239,68,68,0.12)",
    description: "단백질 섭취가 부족하여 근손실과 포만감 저하로 이어질 수 있어요. 매 끼니 양질의 단백질 공급이 핵심입니다.",
    tips: ["끼니마다 달걀·닭가슴살·두부 추가", "단백질 쉐이크 보조 활용", "체중 1kg당 1.2~1.5g 단백질 목표"],
  },
  C: {
    name: "불규칙 식사형",
    emoji: "⏰",
    color: "#8B5CF6",
    bg: "rgba(139,92,246,0.12)",
    description: "식사 시간이 불규칙하여 신진대사가 느려지고 폭식 패턴이 나타날 수 있어요. 규칙적인 식사 루틴 형성이 가장 중요합니다.",
    tips: ["하루 3끼 고정 시간 설정하기", "바쁠 때를 위한 간단 식사 미리 준비", "식사 일지 기록으로 패턴 파악"],
  },
  D: {
    name: "영양 균형형",
    emoji: "✨",
    color: "#85E040",
    bg: "rgba(133,224,64,0.12)",
    description: "전반적으로 균형 잡힌 식습관을 유지하고 있어요! 현재 패턴을 유지하면서 더 세밀한 영양 최적화로 다음 단계로 나아가보세요.",
    tips: ["마이크로 영양소(비타민·미네랄) 점검", "수분 섭취 최적화하기", "식사 타이밍 더 정밀하게 조정"],
  },
};

const ACTIVITY_LEVELS: { label: string; desc: string; value: number }[] = [
  { label: "거의 안 함", desc: "주로 앉아서 생활", value: 1.2 },
  { label: "가벼운 운동", desc: "주 1~3회 가벼운 운동", value: 1.375 },
  { label: "보통 운동", desc: "주 3~5회 중간 강도", value: 1.55 },
  { label: "격렬한 운동", desc: "주 6~7회 강한 운동", value: 1.725 },
  { label: "매우 격렬", desc: "하루 2회 이상 고강도", value: 1.9 },
];

const BMI_GRADES = [
  { label: "저체중", range: "18.5 미만", min: 0, max: 18.5, color: "#06B6D4" },
  { label: "정상", range: "18.5 ~ 22.9", min: 18.5, max: 23, color: "#85E040" },
  { label: "과체중", range: "23 ~ 24.9", min: 23, max: 25, color: "#F59E0B" },
  { label: "비만", range: "25 이상", min: 25, max: 100, color: "#EF4444" },
];

const NOTICES = [
  { id: 1, date: "2025-01-15", title: "2025년 신규 회원 모집 이벤트", badge: "이벤트", content: "새해를 맞아 1:1 인바디 분석 무료 체험 이벤트를 진행합니다. 선착순 20명 한정이니 서둘러 신청하세요!" },
  { id: 2, date: "2025-01-10", title: "겨울방학 집중 8주 프로그램 오픈", badge: "공지", content: "방학 동안 집중적으로 몸을 만들 수 있는 8주 특별 프로그램이 오픈되었습니다. 매주 1:1 피드백 세션 포함." },
  { id: 3, date: "2025-01-05", title: " 맞춤 식단 가이드북 무료 배포", badge: "자료", content: "전문 영양사가 작성한 맞춤 식단 가이드북을 신청자에게 무료로 배포합니다. 신청서 제출 후 수령." },
  { id: 4, date: "2024-12-20", title: "홈 트레이닝 루틴 업데이트", badge: "업데이트", content: "기구 없이 가능한 운동 30종이 새로 추가되었어요. 기숙사나 좁은 방에서도 충분히 활용할 수 있습니다." },
  { id: 5, date: "2024-12-10", title: "12월 체험단 후기 공개", badge: "후기", content: "지난 12월 체험단 10명의 생생한 변화 후기가 공개되었습니다. 평균 체중 -2.8kg, 체지방률 -1.5% 달성!" },
];

const GALLERY_ITEMS = [
  { id: 1, type: "meal", label: "균형 도시락", src: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop&auto=format", alt: "균형 잡힌 건강 도시락 — 채소, 단백질, 복합 탄수화물" },
  { id: 2, type: "exercise", label: "홈 트레이닝", src: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=300&fit=crop&auto=format", alt: "홈 트레이닝 운동 세션 — 맨몸 운동" },
  { id: 3, type: "meal", label: "고단백 식사", src: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=300&fit=crop&auto=format", alt: "고단백 건강 식사 — 닭가슴살과 채소" },
  { id: 4, type: "exercise", label: "스트레칭", src: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=300&fit=crop&auto=format", alt: "스트레칭 및 유연성 운동" },
  { id: 5, type: "meal", label: "건강 아침", src: "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=400&h=300&fit=crop&auto=format", alt: "영양소 가득한 건강한 아침 식사" },
  { id: 6, type: "exercise", label: "근력 운동", src: "https://images.unsplash.com/photo-1534258936925-c58bed479fcb?w=400&h=300&fit=crop&auto=format", alt: "근력 운동 트레이닝 세션" },
  { id: 7, type: "meal", label: "샐러드 볼", src: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop&auto=format", alt: "신선한 채소 샐러드 볼" },
  { id: 8, type: "exercise", label: "유산소 운동", src: "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=400&h=300&fit=crop&auto=format", alt: "유산소 운동 — 러닝" },
];

const LS_KEY = "health_tracker_data";

const DEFAULT_TRACKER: TrackerState = {
  water: 0,
  meals: { breakfast: false, lunch: false, dinner: false },
  exercise: { cardio: false, strength: false, stretch: false },
};

// ─── Helper Functions ─────────────────────────────────────────────────────────
function calcBMI(weight: number, height: number): number {
  return weight / Math.pow(height / 100, 2);
}

function calcBMR(weight: number, height: number, age: number, gender: Gender): number {
  if (gender === "male") {
    return 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age;
  }
  return 447.593 + 9.247 * weight + 3.098 * height - 4.33 * age;
}

function getBMIGrade(bmi: number) {
  return BMI_GRADES.find((g) => bmi >= g.min && bmi < g.max) ?? BMI_GRADES[BMI_GRADES.length - 1];
}

// ─── Sub-Components ───────────────────────────────────────────────────────────
function BadgePill({ label, color }: { label: string; color?: string }) {
  const colorMap: Record<string, string> = {
    이벤트: "bg-[rgba(133,224,64,0.15)] text-[#85E040] border-[rgba(133,224,64,0.3)]",
    공지: "bg-[rgba(6,182,212,0.15)] text-[#06B6D4] border-[rgba(6,182,212,0.3)]",
    자료: "bg-[rgba(139,92,246,0.15)] text-[#A78BFA] border-[rgba(139,92,246,0.3)]",
    업데이트: "bg-[rgba(245,158,11,0.15)] text-[#F59E0B] border-[rgba(245,158,11,0.3)]",
    후기: "bg-[rgba(239,68,68,0.15)] text-[#EF4444] border-[rgba(239,68,68,0.3)]",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${colorMap[label] ?? "bg-muted text-muted-foreground border-border"}`}>
      {label}
    </span>
  );
}

// ─── Page 01: Home ────────────────────────────────────────────────────────────
function PageHome({ onNavigate }: { onNavigate: (p: Page) => void }) {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pt-16 pb-20 md:pt-24 md:pb-32">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-[#85E040] opacity-[0.07] blur-[120px]" />
        </div>
        <div className="relative max-w-3xl mx-auto text-center">
          {/* <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-card text-xs text-muted-foreground mb-6 font-['Outfit']">
            <Sparkles size={12} className="text-primary" />
            2025 신년 특별 이벤트 진행 중
          </div> */}
          <h1 className="font-['Outfit'] text-4xl md:text-6xl font-800 leading-[1.1] text-foreground mb-6">
            당신의 몸에 맞는<br />
            <span className="text-primary">맞춤 식단</span>을 시작하세요
          </h1>
          <p className="font-['Noto_Sans_KR'] text-base md:text-lg text-muted-foreground leading-relaxed mb-10 max-w-xl mx-auto">
            1:1 인바디 분석부터 맞춤 식단 설계, 주간 피드백까지 도와드리는<br />
             실전 헬스케어 프로그램입니다.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => window.open(NAVER_FORM_URL, "_blank")}
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-['Outfit'] font-600 text-base transition-all hover:bg-[#9AEF55] hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_24px_rgba(133,224,64,0.3)]"
            >
              체험 지원 신청서
              <ArrowRight size={18} />
            </button>
            <button
              onClick={() => onNavigate("calculator")}
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl border border-border bg-card text-foreground font-['Outfit'] font-500 text-base transition-all hover:border-primary/50 hover:bg-secondary"
            >
              내 건강 지표 확인하기
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="px-4 mb-16">
        <div className="max-w-3xl mx-auto grid grid-cols-3 gap-3">
          {[
            { value: "127명", label: "누적 참여자" },
            { value: "평균 -3.2kg", label: "4주 기준 체중 변화" },
            { value: "98%", label: "재신청율" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4 text-center">
              <div className="font-['Outfit'] text-2xl font-700 text-primary">{s.value}</div>
              <div className="font-['Noto_Sans_KR'] text-xs text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Program process */}
      <section className="px-4 mb-16">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <p className="font-['Outfit'] text-xs font-500 text-primary tracking-widest uppercase mb-2">How It Works</p>
            <h2 className="font-['Outfit'] text-2xl md:text-3xl font-700 text-foreground">3단계 맞춤 관리 프로세스</h2>
          </div>
          <div className="space-y-4">
            {[
              {
                step: "01",
                icon: <Activity size={20} />,
                title: "1:1 인바디 분석",
                desc: "체성분 분석을 통해 현재 체지방률, 근육량, 기초대사량을 정밀하게 측정하고 개인별 목표를 설정합니다.",
              },
              {
                step: "02",
                icon: <Target size={20} />,
                title: "맞춤 식단 설계",
                desc: "분석 결과를 바탕으로 영양사가 직접 설계하는 1:1 맞춤형 주간 식단표를 제공합니다. 실천 가능한 현실적 식단이에요.",
              },
              {
                step: "03",
                icon: <Users size={20} />,
                title: "주간 피드백 시스템",
                desc: "매주 체크인을 통해 진행 상황을 점검하고 식단을 실시간으로 조정합니다. 혼자가 아니라 함께 해요.",
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-4 p-5 rounded-xl border border-border bg-card group hover:border-primary/30 transition-all">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[rgba(133,224,64,0.12)] flex items-center justify-center text-primary">
                  {item.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-['Outfit'] text-xs font-600 text-primary">STEP {item.step}</span>
                    <span className="font-['Outfit'] text-base font-600 text-foreground">{item.title}</span>
                  </div>
                  <p className="font-['Noto_Sans_KR'] text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="px-4 mb-16">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <p className="font-['Outfit'] text-xs font-500 text-primary tracking-widest uppercase mb-2">Features</p>
            <h2 className="font-['Outfit'] text-2xl md:text-3xl font-700 text-foreground">이런 분들에게 딱 맞아요</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { icon: "🎓", title: "식단 관리가 어려운 분", desc: "기숙사·학교 식당 환경에서도 실천 가능한 현실적인 식단을 제공해요." },
              { icon: "⚖️", title: "체중 감량이 목표인 분", desc: "단순 칼로리 제한이 아닌 체성분 개선을 통한 건강한 체중 감량." },
              { icon: "💪", title: "근육량을 늘리고 싶은 분", desc: "운동과 식단을 연계하여 효율적인 근성장을 도와드려요." },
              { icon: "📊", title: "내 몸 상태가 궁금한 분", desc: "인바디 분석으로 현재 체성분 상태를 정확하게 파악할 수 있어요." },
            ].map((f) => (
              <div key={f.title} className="p-5 rounded-xl border border-border bg-card hover:border-primary/30 transition-all">
                <div className="text-2xl mb-3">{f.icon}</div>
                <h3 className="font-['Outfit'] text-base font-600 text-foreground mb-1.5">{f.title}</h3>
                <p className="font-['Noto_Sans_KR'] text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="px-4 pb-20">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl border border-primary/30 bg-[rgba(133,224,64,0.06)] p-8 md:p-10 text-center relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-primary opacity-5 blur-3xl" />
            </div>
            <div className="relative">
              <div className="text-3xl mb-3">🎁</div>
              <h2 className="font-['Outfit'] text-2xl md:text-3xl font-700 text-foreground mb-3">
                지금 신청하면 <span className="text-primary">무료 체험</span>
              </h2>
              <p className="font-['Noto_Sans_KR'] text-sm text-muted-foreground mb-6 leading-relaxed">
                1:1 인바디 분석 + 맞춤 식단 1주치 + 피드백 1회<br />
                선착순 20명 한정 · 부담 없이 시작해보세요
              </p>
              <button
                onClick={() => window.open(NAVER_FORM_URL, "_blank")}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-['Outfit'] font-600 text-base transition-all hover:bg-[#9AEF55] hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_24px_rgba(133,224,64,0.25)]"
              >
                체험 지원 신청서 작성하기
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── Page 02: Calculator + Quiz ───────────────────────────────────────────────
function PageCalculator() {
  const [tab, setTab] = useState<"calc" | "quiz">("calc");

  // Calculator state
  const [gender, setGender] = useState<Gender>("male");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [age, setAge] = useState("");
  const [activity, setActivity] = useState(1.55);
  const [result, setResult] = useState<{ bmi: number; bmr: number; tdee: number } | null>(null);
  const [calcError, setCalcError] = useState("");

  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState<Record<number, { A: number; B: number; C: number; D: number }>>({});
  const [quizResult, setQuizResult] = useState<DietTypeKey | null>(null);

  const handleCalc = useCallback(() => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    const a = parseInt(age);
    if (!h || !w || !a || h < 100 || h > 250 || w < 20 || w > 300 || a < 10 || a > 100) {
      setCalcError("올바른 신체 정보를 입력해주세요.");
      setResult(null);
      return;
    }
    setCalcError("");
    const bmi = calcBMI(w, h);
    const bmr = calcBMR(w, h, a, gender);
    const tdee = bmr * activity;
    setResult({ bmi, bmr, tdee });
  }, [height, weight, age, gender, activity]);

  const handleQuizAnswer = (questionId: number, scores: { A: number; B: number; C: number; D: number }) => {
    setQuizAnswers((prev) => ({ ...prev, [questionId]: scores }));
    setQuizResult(null);
  };

  const handleQuizSubmit = () => {
    const totals = { A: 0, B: 0, C: 0, D: 0 };
    Object.values(quizAnswers).forEach((s) => {
      totals.A += s.A;
      totals.B += s.B;
      totals.C += s.C;
      totals.D += s.D;
    });
    const winner = (Object.entries(totals).sort(([, a], [, b]) => b - a)[0][0]) as DietTypeKey;
    setQuizResult(winner);
  };

  const allAnswered = Object.keys(quizAnswers).length === QUIZ_QUESTIONS.length;
  const bmiGrade = result ? getBMIGrade(result.bmi) : null;

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <p className="font-['Outfit'] text-xs font-500 text-primary tracking-widest uppercase mb-2">Tools</p>
          <h1 className="font-['Outfit'] text-2xl md:text-3xl font-700 text-foreground">건강 지표 & 유형 테스트</h1>
          <p className="font-['Noto_Sans_KR'] text-sm text-muted-foreground mt-1">나의 현재 상태를 정확히 파악하는 첫 번째 단계</p>
        </div>

        {/* Tab switch */}
        <div className="flex gap-1 p-1 rounded-xl bg-card border border-border mb-8">
          {[
            { id: "calc" as const, label: "BMI · BMR 계산기" },
            { id: "quiz" as const, label: "식단 유형 테스트" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-2.5 rounded-lg font-['Outfit'] text-sm font-500 transition-all ${
                tab === t.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "calc" && (
          <div className="space-y-5">
            {/* Gender */}
            <div>
              <label className="font-['Outfit'] text-sm font-500 text-foreground block mb-2">성별</label>
              <div className="flex gap-2">
                {(["male", "female"] as Gender[]).map((g) => (
                  <button
                    key={g}
                    onClick={() => setGender(g)}
                    className={`flex-1 py-3 rounded-xl border font-['Outfit'] text-sm font-500 transition-all ${
                      gender === g
                        ? "border-primary bg-[rgba(133,224,64,0.12)] text-primary"
                        : "border-border bg-card text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {g === "male" ? "남성 ♂" : "여성 ♀"}
                  </button>
                ))}
              </div>
            </div>

            {/* Numeric inputs */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "신장 (cm)", value: height, setter: setHeight, placeholder: "170" },
                { label: "체중 (kg)", value: weight, setter: setWeight, placeholder: "65" },
                { label: "나이 (세)", value: age, setter: setAge, placeholder: "22" },
              ].map((field) => (
                <div key={field.label}>
                  <label className="font-['Outfit'] text-sm font-500 text-foreground block mb-2">{field.label}</label>
                  <input
                    type="number"
                    value={field.value}
                    onChange={(e) => field.setter(e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-3 rounded-xl border border-border bg-input-background text-foreground font-['Outfit'] text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 transition-all"
                  />
                </div>
              ))}
            </div>

            {/* Activity */}
            <div>
              <label className="font-['Outfit'] text-sm font-500 text-foreground block mb-2">활동량</label>
              <div className="space-y-2">
                {ACTIVITY_LEVELS.map((al) => (
                  <button
                    key={al.value}
                    onClick={() => setActivity(al.value)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all ${
                      activity === al.value
                        ? "border-primary bg-[rgba(133,224,64,0.1)] text-primary"
                        : "border-border bg-card text-foreground hover:border-primary/30"
                    }`}
                  >
                    <span className="font-['Outfit'] text-sm font-500">{al.label}</span>
                    <span className="font-['Noto_Sans_KR'] text-xs text-muted-foreground">{al.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {calcError && <p className="text-destructive font-['Noto_Sans_KR'] text-sm">{calcError}</p>}

            <button
              onClick={handleCalc}
              className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-['Outfit'] font-600 text-base transition-all hover:bg-[#9AEF55] hover:scale-[1.01] active:scale-[0.99] shadow-[0_0_20px_rgba(133,224,64,0.2)]"
            >
              계산하기
            </button>

            {result && bmiGrade && (
              <div className="rounded-2xl border border-border bg-card p-6 space-y-5 animate-[fadeIn_0.3s_ease]">
                <h3 className="font-['Outfit'] text-lg font-600 text-foreground">분석 결과</h3>

                {/* BMI */}
                <div>
                  <div className="flex items-end justify-between mb-2">
                    <span className="font-['Outfit'] text-sm text-muted-foreground">BMI (체질량지수)</span>
                    <span className="font-['Outfit'] text-2xl font-700 text-foreground">{result.bmi.toFixed(1)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden mb-2">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(100, (result.bmi / 40) * 100)}%`,
                        backgroundColor: bmiGrade.color,
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-600 font-['Outfit']"
                      style={{ backgroundColor: `${bmiGrade.color}22`, color: bmiGrade.color }}
                    >
                      {bmiGrade.label}
                    </span>
                    <span className="font-['Noto_Sans_KR'] text-xs text-muted-foreground">{bmiGrade.range}</span>
                  </div>
                </div>

                {/* BMR + TDEE */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-secondary">
                    <p className="font-['Outfit'] text-xs text-muted-foreground mb-1">기초대사량 (BMR)</p>
                    <p className="font-['Outfit'] text-xl font-700 text-foreground">{Math.round(result.bmr)}<span className="text-sm font-400 text-muted-foreground ml-1">kcal</span></p>
                  </div>
                  <div className="p-4 rounded-xl bg-[rgba(133,224,64,0.1)] border border-primary/20">
                    <p className="font-['Outfit'] text-xs text-muted-foreground mb-1">일일 권장 칼로리</p>
                    <p className="font-['Outfit'] text-xl font-700 text-primary">{Math.round(result.tdee)}<span className="text-sm font-400 text-muted-foreground ml-1">kcal</span></p>
                  </div>
                </div>

                <button
                  onClick={() => window.open(NAVER_FORM_URL, "_blank")}
                  className="w-full py-3.5 rounded-xl border border-primary/30 bg-[rgba(133,224,64,0.06)] text-primary font-['Outfit'] font-600 text-sm flex items-center justify-center gap-2 hover:bg-[rgba(133,224,64,0.12)] transition-all"
                >
                  내 지표에 맞는 식단표 신청하기
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}

        {tab === "quiz" && (
          <div className="space-y-6">
            {QUIZ_QUESTIONS.map((q, qi) => (
              <div key={q.id} className="rounded-xl border border-border bg-card p-5">
                <p className="font-['Outfit'] text-xs font-500 text-primary mb-1">Q{qi + 1}</p>
                <p className="font-['Noto_Sans_KR'] text-sm font-500 text-foreground mb-4 leading-relaxed">{q.question}</p>
                <div className="space-y-2">
                  {q.options.map((opt) => {
                    const selected = quizAnswers[q.id];
                    const isSelected = selected && JSON.stringify(selected) === JSON.stringify(opt.scores);
                    return (
                      <button
                        key={opt.label}
                        onClick={() => handleQuizAnswer(q.id, opt.scores)}
                        className={`w-full text-left px-4 py-3 rounded-lg border font-['Noto_Sans_KR'] text-sm transition-all ${
                          isSelected
                            ? "border-primary bg-[rgba(133,224,64,0.1)] text-primary"
                            : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <button
              onClick={handleQuizSubmit}
              disabled={!allAnswered}
              className={`w-full py-4 rounded-xl font-['Outfit'] font-600 text-base transition-all ${
                allAnswered
                  ? "bg-primary text-primary-foreground hover:bg-[#9AEF55] hover:scale-[1.01] active:scale-[0.99] shadow-[0_0_20px_rgba(133,224,64,0.2)]"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
            >
              {allAnswered ? "결과 확인하기" : `${QUIZ_QUESTIONS.length - Object.keys(quizAnswers).length}개 질문 남음`}
            </button>

            {quizResult && (() => {
              const dt = DIET_TYPES[quizResult];
              return (
                <div
                  className="rounded-2xl border p-6 animate-[fadeIn_0.4s_ease]"
                  style={{ borderColor: `${dt.color}40`, backgroundColor: dt.bg }}
                >
                  <div className="text-4xl mb-3">{dt.emoji}</div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-600 font-['Outfit'] mb-3" style={{ backgroundColor: `${dt.color}22`, color: dt.color }}>
                    나의 식단 유형
                  </div>
                  <h3 className="font-['Outfit'] text-2xl font-700 text-foreground mb-3">{dt.name}</h3>
                  <p className="font-['Noto_Sans_KR'] text-sm text-muted-foreground leading-relaxed mb-5">{dt.description}</p>
                  <div className="space-y-2 mb-6">
                    {dt.tips.map((tip) => (
                      <div key={tip} className="flex items-start gap-2">
                        <span className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-xs" style={{ backgroundColor: `${dt.color}30`, color: dt.color }}>✓</span>
                        <span className="font-['Noto_Sans_KR'] text-sm text-foreground">{tip}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => window.open(NAVER_FORM_URL, "_blank")}
                    className="w-full py-3.5 rounded-xl font-['Outfit'] font-600 text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
                    style={{ backgroundColor: dt.color, color: "#0B2519" }}
                  >
                    내 유형에 맞는 식단표 신청하기
                    <ArrowRight size={16} />
                  </button>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page 03: Checklist ───────────────────────────────────────────────────────
function PageChecklist() {
  const [tracker, setTracker] = useState<TrackerState>(DEFAULT_TRACKER);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as TrackerState;
        setTracker({ ...DEFAULT_TRACKER, ...parsed });
      }
    } catch {
      setTracker(DEFAULT_TRACKER);
    }
  }, []);

  const save = useCallback((next: TrackerState) => {
    setTracker(next);
    localStorage.setItem(LS_KEY, JSON.stringify(next));
  }, []);

  const adjustWater = (delta: number) => {
    const next = Math.max(0, Math.min(4000, tracker.water + delta));
    save({ ...tracker, water: next });
  };

  const toggleMeal = (key: keyof TrackerState["meals"]) => {
    save({ ...tracker, meals: { ...tracker.meals, [key]: !tracker.meals[key] } });
  };

  const toggleExercise = (key: keyof TrackerState["exercise"]) => {
    save({ ...tracker, exercise: { ...tracker.exercise, [key]: !tracker.exercise[key] } });
  };

  const reset = () => save(DEFAULT_TRACKER);

  const mealKeys: (keyof TrackerState["meals"])[] = ["breakfast", "lunch", "dinner"];
  const mealLabels = { breakfast: "아침 식사", lunch: "점심 식사", dinner: "저녁 식사" };
  const mealIcons = { breakfast: "🌅", lunch: "☀️", dinner: "🌙" };

  const exKeys: (keyof TrackerState["exercise"])[] = ["cardio", "strength", "stretch"];
  const exLabels = { cardio: "유산소 운동", strength: "근력 운동", stretch: "스트레칭" };
  const exIcons = { cardio: "🏃", strength: "💪", stretch: "🧘" };

  const waterCups = Math.floor(tracker.water / 250);
  const waterPercent = Math.min(100, (tracker.water / 2000) * 100);
  const doneCount = Object.values(tracker.meals).filter(Boolean).length + Object.values(tracker.exercise).filter(Boolean).length;
  const totalCount = 6;

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="font-['Outfit'] text-xs font-500 text-primary tracking-widest uppercase mb-2">Daily Check</p>
            <h1 className="font-['Outfit'] text-2xl md:text-3xl font-700 text-foreground">오늘의 건강 체크리스트</h1>
            <p className="font-['Noto_Sans_KR'] text-sm text-muted-foreground mt-1">기록은 새로고침해도 유지돼요</p>
          </div>
          <button
            onClick={reset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all font-['Outfit'] text-xs"
          >
            <RotateCcw size={13} />
            초기화
          </button>
        </div>

        {/* Progress */}
        <div className="rounded-2xl border border-border bg-card p-5 mb-5">
          <div className="flex items-center justify-between mb-3">
            <span className="font-['Outfit'] text-sm font-500 text-foreground">오늘 진행률</span>
            <span className="font-['Outfit'] text-sm font-600 text-primary">{doneCount} / {totalCount}</span>
          </div>
          <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(doneCount / totalCount) * 100}%`, backgroundColor: "#85E040" }}
            />
          </div>
          {doneCount === totalCount && (
            <p className="font-['Noto_Sans_KR'] text-sm text-primary mt-3 text-center">🎉 오늘 모든 체크를 완료했어요!</p>
          )}
        </div>

        {/* Water */}
        <div className="rounded-2xl border border-border bg-card p-5 mb-5">
          <div className="flex items-center gap-2 mb-4">
            <Droplets size={18} className="text-[#06B6D4]" />
            <span className="font-['Outfit'] text-base font-600 text-foreground">수분 섭취량</span>
          </div>
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => adjustWater(-250)}
              disabled={tracker.water <= 0}
              className="w-11 h-11 rounded-xl border border-border bg-secondary flex items-center justify-center text-foreground hover:border-primary/40 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Minus size={18} />
            </button>
            <div className="text-center">
              <p className="font-['Outfit'] text-4xl font-700 text-foreground">{tracker.water}<span className="text-base font-400 text-muted-foreground ml-1">ml</span></p>
              <p className="font-['Noto_Sans_KR'] text-xs text-muted-foreground mt-1">{waterCups}잔 / 목표 2,000ml</p>
            </div>
            <button
              onClick={() => adjustWater(250)}
              disabled={tracker.water >= 4000}
              className="w-11 h-11 rounded-xl border border-border bg-secondary flex items-center justify-center text-foreground hover:border-primary/40 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Plus size={18} />
            </button>
          </div>
          {/* Water cups visual */}
          <div className="flex gap-1.5 justify-center flex-wrap mb-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="w-7 h-8 rounded-md border transition-all duration-300"
                style={{
                  borderColor: i < waterCups ? "#06B6D4" : "rgba(255,255,255,0.1)",
                  backgroundColor: i < waterCups ? "rgba(6,182,212,0.2)" : "transparent",
                }}
              >
                <div className="text-center text-xs pt-1.5">
                  {i < waterCups ? <span style={{ color: "#06B6D4" }}>💧</span> : ""}
                </div>
              </div>
            ))}
          </div>
          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${waterPercent}%`, backgroundColor: "#06B6D4" }}
            />
          </div>
        </div>

        {/* Meals */}
        <div className="rounded-2xl border border-border bg-card p-5 mb-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">🍽️</span>
            <span className="font-['Outfit'] text-base font-600 text-foreground">식단 체크</span>
          </div>
          <div className="space-y-2">
            {mealKeys.map((key) => {
              const done = tracker.meals[key];
              return (
                <button
                  key={key}
                  onClick={() => toggleMeal(key)}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${
                    done
                      ? "border-primary/30 bg-[rgba(133,224,64,0.08)]"
                      : "border-border hover:border-primary/20"
                  }`}
                >
                  <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    done ? "border-primary bg-primary" : "border-border"
                  }`}>
                    {done && <span className="text-primary-foreground text-xs font-700">✓</span>}
                  </div>
                  <span className="text-lg">{mealIcons[key]}</span>
                  <span className={`font-['Noto_Sans_KR'] text-sm font-500 transition-all ${done ? "text-primary" : "text-foreground"}`}>
                    {mealLabels[key]}
                  </span>
                  {done && <span className="ml-auto font-['Noto_Sans_KR'] text-xs text-primary">완료!</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Exercise */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">🏋️</span>
            <span className="font-['Outfit'] text-base font-600 text-foreground">운동 체크</span>
          </div>
          <div className="space-y-2">
            {exKeys.map((key) => {
              const done = tracker.exercise[key];
              return (
                <button
                  key={key}
                  onClick={() => toggleExercise(key)}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${
                    done
                      ? "border-primary/30 bg-[rgba(133,224,64,0.08)]"
                      : "border-border hover:border-primary/20"
                  }`}
                >
                  <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    done ? "border-primary bg-primary" : "border-border"
                  }`}>
                    {done && <span className="text-primary-foreground text-xs font-700">✓</span>}
                  </div>
                  <span className="text-lg">{exIcons[key]}</span>
                  <span className={`font-['Noto_Sans_KR'] text-sm font-500 transition-all ${done ? "text-primary" : "text-foreground"}`}>
                    {exLabels[key]}
                  </span>
                  {done && <span className="ml-auto font-['Noto_Sans_KR'] text-xs text-primary">완료!</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page 04: Board ───────────────────────────────────────────────────────────
function PageBoard() {
  const [galleryFilter, setGalleryFilter] = useState<"all" | "meal" | "exercise">("all");
  const [expanded, setExpanded] = useState<number | null>(null);

  const filtered = galleryFilter === "all" ? GALLERY_ITEMS : GALLERY_ITEMS.filter((g) => g.type === galleryFilter);

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <p className="font-['Outfit'] text-xs font-500 text-primary tracking-widest uppercase mb-2">Community</p>
          <h1 className="font-['Outfit'] text-2xl md:text-3xl font-700 text-foreground">소식 & 갤러리</h1>
          <p className="font-['Noto_Sans_KR'] text-sm text-muted-foreground mt-1">최신 공지와 프로그램 식단·운동 사진</p>
        </div>

        {/* Notices */}
        <div className="mb-12">
          <h2 className="font-['Outfit'] text-lg font-600 text-foreground mb-4 flex items-center gap-2">
            <span className="w-1 h-5 rounded-full bg-primary inline-block" />
            공지사항
          </h2>
          <div className="space-y-2">
            {NOTICES.map((n) => (
              <div key={n.id} className="rounded-xl border border-border bg-card overflow-hidden">
                <button
                  className="w-full flex items-start gap-3 p-4 text-left hover:bg-secondary/50 transition-all"
                  onClick={() => setExpanded(expanded === n.id ? null : n.id)}
                >
                  <BadgePill label={n.badge} />
                  <div className="flex-1 min-w-0">
                    <p className="font-['Noto_Sans_KR'] text-sm font-500 text-foreground leading-snug">{n.title}</p>
                    <p className="font-['Outfit'] text-xs text-muted-foreground mt-0.5">{n.date}</p>
                  </div>
                  <ChevronRight
                    size={16}
                    className={`flex-shrink-0 text-muted-foreground transition-transform mt-0.5 ${expanded === n.id ? "rotate-90" : ""}`}
                  />
                </button>
                {expanded === n.id && (
                  <div className="px-4 pb-4 border-t border-border pt-3">
                    <p className="font-['Noto_Sans_KR'] text-sm text-muted-foreground leading-relaxed">{n.content}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Gallery */}
        <div>
          <h2 className="font-['Outfit'] text-lg font-600 text-foreground mb-4 flex items-center gap-2">
            <span className="w-1 h-5 rounded-full bg-primary inline-block" />
            식단 &amp; 운동 갤러리
          </h2>
          <div className="flex gap-2 mb-5">
            {[
              { key: "all" as const, label: "전체" },
              { key: "meal" as const, label: "🍱 식단" },
              { key: "exercise" as const, label: "🏋️ 운동" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setGalleryFilter(f.key)}
                className={`px-4 py-1.5 rounded-full text-sm font-['Outfit'] font-500 border transition-all ${
                  galleryFilter === f.key
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {filtered.map((item) => (
              <div key={item.id} className="group rounded-xl overflow-hidden border border-border bg-card aspect-[4/3] relative">
                <img
                  src={item.src}
                  alt={item.alt}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                  <span className="font-['Outfit'] text-sm font-500 text-white">{item.label}</span>
                </div>
                <div className="absolute top-2 right-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-500 font-['Outfit'] backdrop-blur-sm ${
                    item.type === "meal"
                      ? "bg-[rgba(133,224,64,0.8)] text-[#0B2519]"
                      : "bg-[rgba(139,92,246,0.8)] text-white"
                  }`}>
                    {item.type === "meal" ? "식단" : "운동"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Navigation ───────────────────────────────────────────────────────────────
const NAV_ITEMS: { id: Page; label: string; icon: React.ReactNode }[] = [
  { id: "home", label: "홈", icon: <Home size={20} /> },
  { id: "calculator", label: "계산기", icon: <Calculator size={20} /> },
  { id: "checklist", label: "체크리스트", icon: <ClipboardList size={20} /> },
  { id: "board", label: "소식", icon: <Newspaper size={20} /> },
];

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState<Page>("home");

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'Outfit', 'Noto Sans KR', sans-serif" }}>
      {/* Top header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Zap size={14} className="text-primary-foreground" />
            </div>
            <span className="font-['Outfit'] text-base font-700 text-foreground">FitDiet</span>
          </div>
          <button
            onClick={() => window.open(NAVER_FORM_URL, "_blank")}
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-['Outfit'] font-600 text-sm transition-all hover:bg-[#9AEF55]"
          >
            무료 체험 신청
            <ArrowRight size={14} />
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="pb-24">
        {page === "home" && <PageHome onNavigate={setPage} />}
        {page === "calculator" && <PageCalculator />}
        {page === "checklist" && <PageChecklist />}
        {page === "board" && <PageBoard />}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex">
            {NAV_ITEMS.map((item) => {
              const active = page === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setPage(item.id)}
                  className={`flex-1 flex flex-col items-center gap-1 py-3 transition-all ${
                    active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className={`transition-transform ${active ? "scale-110" : ""}`}>{item.icon}</div>
                  <span className="font-['Outfit'] text-[10px] font-500">{item.label}</span>
                  {active && <div className="absolute bottom-0 w-6 h-0.5 rounded-full bg-primary" />}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        ::-webkit-scrollbar { display: none; }
        * { scrollbar-width: none; }
      `}</style>
    </div>
  );
}
