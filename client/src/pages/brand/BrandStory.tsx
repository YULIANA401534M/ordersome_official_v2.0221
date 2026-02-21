import BrandLayout from "@/components/layout/BrandLayout";

export default function BrandStory() {
  return (
    <BrandLayout>
      {/* Hero */}
      <section className="relative py-20 bg-gradient-to-br from-amber-50 to-white">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">
              品牌故事
            </h1>
            <p className="text-lg text-gray-600">
              來點什麼的誕生，源自於對美食的熱愛與堅持
            </p>
          </div>
        </div>
      </section>

      {/* Story Content */}
      <section className="py-20">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
              <div>
                <img
                  src="/images/brand-logo-yellow.png"
                  alt="來點什麼"
                  className="w-full max-w-sm mx-auto"
                />
              </div>
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-gray-900">
                  來點什麼的起源
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  「來點什麼」品牌創立於台灣，源自於創辦人對餐飲的熱情與對品質的堅持。
                  我們相信，每一份餐點都應該用心製作，每一位顧客都值得最好的服務。
                </p>
                <p className="text-gray-600 leading-relaxed">
                  品牌名稱「來點什麼」代表著我們希望成為顧客生活中的美好選擇。
                  無論您想要什麼，來點什麼都能為您準備最美味的餐點。
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
              <div className="order-2 md:order-1 space-y-6">
                <h2 className="text-3xl font-bold text-gray-900">
                  我們的理念
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  我們堅持使用新鮮、優質的食材，每一道餐點都經過精心設計與製作。
                  從食材的挑選到餐點的呈現，我們都追求完美。
                </p>
                <p className="text-gray-600 leading-relaxed">
                  「用心做好每一份餐點」是我們的核心理念。
                  我們相信，只有用心，才能做出讓顧客滿意的美食。
                </p>
              </div>
              <div className="order-1 md:order-2">
                <img
                  src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663285169742/cAkpoRocvsmsyigJ.png"
                  alt="我們的理念 - 韓式飯捲、台式蛋餅、鐵板麵"
                  className="w-full rounded-2xl shadow-lg"
                />
              </div>
            </div>

            <div className="bg-primary/10 rounded-3xl p-8 md:p-12 text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                我們的願景
              </h2>
              <p className="text-gray-600 leading-relaxed max-w-2xl mx-auto">
                成為台灣最受歡迎的連鎖餐飲品牌，讓每一位顧客都能在「來點什麼」
                找到屬於自己的美味。我們將持續創新，不斷提升服務品質，
                為顧客帶來更多驚喜與感動。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-gray-50">
        <div className="container">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            核心價值
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-32 h-32 mx-auto mb-6">
                <img
                  src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663285169742/SIWurtfCNOMHbquP.png"
                  alt="品質至上"
                  className="w-full h-full object-contain"
                />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">品質至上</h3>
              <p className="text-gray-600">
                嚴選食材，精心製作，確保每一份餐點都達到最高品質
              </p>
            </div>
            <div className="text-center">
              <div className="w-32 h-32 mx-auto mb-6">
                <img
                  src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663285169742/iJelVRmLamxKoAet.png"
                  alt="用心服務"
                  className="w-full h-full object-contain"
                />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">用心服務</h3>
              <p className="text-gray-600">
                以顧客為中心，提供親切、專業的服務體驗
              </p>
            </div>
            <div className="text-center">
              <div className="w-32 h-32 mx-auto mb-6">
                <img
                  src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663285169742/mVuPqQywfiwTAcdi.png"
                  alt="持續創新"
                  className="w-full h-full object-contain"
                />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">持續創新</h3>
              <p className="text-gray-600">
                不斷研發新品，為顧客帶來更多美味選擇
              </p>
            </div>
          </div>
        </div>
      </section>
    </BrandLayout>
  );
}
