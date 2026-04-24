import BrandLayout from "@/components/layout/BrandLayout";

const values = [
  {
    title: "熟悉感",
    description: "先讓人覺得這是自己會想吃的早餐，再慢慢加進新的味道。",
  },
  {
    title: "年輕感",
    description: "不是幼稚，而是更亮、更輕、更有被記住的可能。",
  },
  {
    title: "混搭感",
    description: "台式和韓味不是互搶，是互相幫忙，把品牌做得更有記憶點。",
  },
];

export default function BrandStory() {
  return (
    <BrandLayout>
      <section className="px-6 pb-10 pt-6 md:pb-12 md:pt-10">
        <div className="container">
          <div className="max-w-3xl">
            <p className="inline-flex rounded-full bg-[#fff1bf] px-4 py-2 text-xs font-semibold tracking-[0.2em] text-[#9d7400]">
              STORY
            </p>
            <h1 className="mt-5 text-[clamp(2.7rem,6vw,5rem)] font-black tracking-[-0.06em] text-[#181512]">
              來點什麼不是走很遠，
              <span className="block">是走得更剛好</span>
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-[#675e50] md:text-lg">
              它沒有想把自己做成很重的韓式品牌，也不是回到最傳統的早餐店，而是卡在一個更年輕、更新鮮的位置。
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 pb-14">
        <div className="container">
          <div className="grid gap-8 lg:grid-cols-[minmax(280px,0.86fr)_minmax(0,1.14fr)] lg:items-center">
            <div className="rounded-[34px] border border-[#ece1c7] bg-[linear-gradient(140deg,#fff9ea_0%,#fff2c7_100%)] p-6 shadow-[0_20px_60px_-44px_rgba(91,66,18,0.28)]">
              <div className="flex aspect-[4/5] items-center justify-center rounded-[28px] bg-white/60">
                <img src="/logos/brand-logo-yellow.png" alt="來點什麼" className="h-28 w-auto md:h-32" />
              </div>
            </div>

            <div className="space-y-5 text-[#675e50]">
              <p className="text-lg leading-9">
                來點什麼最可愛的地方，就是它不是那種很嚴肅在講品牌理念的店。它更像一個你本來就會想走進去的地方，只是剛好比一般早餐店多一點韓味和年輕感。
              </p>
              <p className="text-lg leading-9">
                所以這個品牌真正該成立的，不是很多空泛的大詞，而是店面氣氛、菜單記憶點、視覺節奏，還有一種「這家看起來不太一樣」的感覺。
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 pb-20 md:pb-24">
        <div className="container">
          <div className="grid gap-5 md:grid-cols-3">
            {values.map((item) => (
              <article key={item.title} className="rounded-[30px] border border-[#ece1c7] bg-white p-7 shadow-[0_18px_50px_-44px_rgba(91,66,18,0.25)]">
                <h2 className="text-2xl font-black tracking-[-0.04em] text-[#181512]">{item.title}</h2>
                <p className="mt-4 text-sm leading-7 text-[#675e50]">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </BrandLayout>
  );
}
