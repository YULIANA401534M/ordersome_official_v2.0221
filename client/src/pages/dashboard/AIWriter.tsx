import { useState } from "react";
import { trpc } from "../../lib/trpc";
import { Switch } from "@/components/ui/switch";
import { Loader2, Sparkles, ChevronDown, X, Plus } from "lucide-react";
import { toast } from "sonner";
import AdminDashboardLayout from "@/components/AdminDashboardLayout";

type Style = "brand" | "franchise";

type ArticleResult = {
  title: string;
  excerpt: string;
  content: string;
  category: string;
};

const CATEGORY_BADGE: Record<string, { color: string; bg: string }> = {
  餐飲新聞: { color: "var(--os-info)",      bg: "var(--os-info-bg)" },
  品牌動態: { color: "var(--os-success)",   bg: "var(--os-success-bg)" },
  加盟快報: { color: "var(--os-amber-text)", bg: "var(--os-amber-soft)" },
  集團公告: { color: "var(--os-text-3)",    bg: "var(--os-surface-2)" },
};

const inputSt: React.CSSProperties = { width: "100%", padding: "8px 12px", border: "1px solid var(--os-border)", borderRadius: 8, fontSize: 13, background: "var(--os-surface)", color: "var(--os-text-1)", outline: "none" };
const labelSt: React.CSSProperties = { fontSize: 13, fontWeight: 500, color: "var(--os-text-1)", display: "block", marginBottom: 6 };
const subSt: React.CSSProperties = { fontSize: 11, color: "var(--os-text-3)", marginTop: 2 };

function countChars(html: string): number {
  return html.replace(/<[^>]*>/g, "").length;
}

export default function AIWriter() {
  const [topic, setTopic] = useState("");
  const [style, setStyle] = useState<Style>("brand");
  const [useNews, setUseNews] = useState(true);
  const [publishTargets, setPublishTargets] = useState<string[]>(["brand"]);
  const [article, setArticle] = useState<ArticleResult | null>(null);

  const [autoOpen, setAutoOpen] = useState(false);
  const [autoEnabled, setAutoEnabled] = useState(() => localStorage.getItem("aiwriter_auto_enabled") === "true");
  const [autoTime, setAutoTime] = useState(() => localStorage.getItem("aiwriter_auto_time") ?? "08:00");
  const [brandTopics, setBrandTopics] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem("aiwriter_brand_topics") ?? "[]"); } catch { return []; } });
  const [franchiseTopics, setFranchiseTopics] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem("aiwriter_franchise_topics") ?? "[]"); } catch { return []; } });
  const [newBrandTopic, setNewBrandTopic] = useState("");
  const [newFranchiseTopic, setNewFranchiseTopic] = useState("");

  const generateMutation = trpc.aiWriter.generateArticle.useMutation({
    onSuccess: (data) => setArticle(data),
    onError: (err) => toast.error(`生成失敗：${err.message}`),
  });

  const saveMutation = trpc.aiWriter.saveAsDraft.useMutation({
    onSuccess: (_, variables) => {
      toast.success(variables.published ? "文章已發布！" : "已存為草稿，請至內容管理審核發布");
    },
    onError: (err) => toast.error(`儲存失敗：${err.message}`),
  });

  function handleGenerate() {
    if (!topic.trim()) { toast.error("請輸入文章主題"); return; }
    generateMutation.mutate({ topic, style, useNews });
  }

  function handleSave(published: boolean) {
    if (!article) return;
    saveMutation.mutate({ title: article.title, excerpt: article.excerpt, content: article.content, category: article.category, publishTargets, published });
  }

  function saveAutoSettings() {
    localStorage.setItem("aiwriter_auto_enabled", String(autoEnabled));
    localStorage.setItem("aiwriter_auto_time", autoTime);
    localStorage.setItem("aiwriter_brand_topics", JSON.stringify(brandTopics));
    localStorage.setItem("aiwriter_franchise_topics", JSON.stringify(franchiseTopics));
    toast.success("設定已儲存");
  }

  function toggleTarget(target: string) {
    setPublishTargets((prev) => prev.includes(target) ? prev.filter((t) => t !== target) : [...prev, target]);
  }

  const panelSt: React.CSSProperties = { background: "var(--os-surface)", border: "1px solid var(--os-border)", borderRadius: 12, padding: 20 };

  return (
    <AdminDashboardLayout>
      <div style={{ background: "var(--os-bg)", minHeight: "100vh", padding: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Header */}
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--os-text-1)", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <Sparkles style={{ width: 20, height: 20, color: "var(--os-amber)" }} />AI 文章助手
            </h1>
            <p style={{ fontSize: 13, color: "var(--os-text-3)", marginTop: 2 }}>半自動內容生成系統</p>
          </div>

          <div className="flex flex-col lg:flex-row gap-5">
            {/* Left: Settings */}
            <div style={{ width: "100%", maxWidth: 420 }} className="flex flex-col gap-4">

              {/* Main Settings */}
              <div style={panelSt} className="space-y-5">

                {/* Topic */}
                <div>
                  <label style={labelSt}>文章主題</label>
                  <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="台中早午餐推薦、加盟創業、韓式飯捲"
                    onKeyDown={(e) => e.key === "Enter" && handleGenerate()} style={inputSt} />
                </div>

                {/* Style */}
                <div>
                  <label style={labelSt}>文章風格</label>
                  <div className="space-y-2">
                    {[
                      { val: "brand",     label: "品牌文章",  sub: "（輕鬆活潑）" },
                      { val: "franchise", label: "加盟文章",  sub: "（專業正式）" },
                    ].map(opt => {
                      const active = style === opt.val;
                      return (
                        <label key={opt.val} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, cursor: "pointer", border: `2px solid ${active ? "var(--os-amber)" : "var(--os-border)"}`, background: active ? "var(--os-amber-soft)" : "var(--os-surface-2)", transition: "all 0.15s" }}>
                          <input type="radio" value={opt.val} checked={active} onChange={() => setStyle(opt.val as Style)}
                            style={{ width: 15, height: 15, accentColor: "var(--os-amber)" }} />
                          <span style={{ fontSize: 13, color: "var(--os-text-1)" }}>{opt.label}</span>
                          <span style={{ fontSize: 11, color: "var(--os-text-3)" }}>{opt.sub}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Reference News */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--os-text-1)" }}>參考時事新聞</div>
                    <div style={subSt}>開啟後 AI 會參考最新台灣新聞</div>
                  </div>
                  <Switch checked={useNews} onCheckedChange={setUseNews} />
                </div>

                {/* Publish Targets */}
                <div>
                  <label style={labelSt}>發布目標</label>
                  <div className="space-y-2">
                    {[
                      { key: "brand",     name: "來點什麼官網" },
                      { key: "corporate", name: "宇聯官網" },
                    ].map(t => {
                      const checked = publishTargets.includes(t.key);
                      return (
                        <label key={t.key} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                          <input type="checkbox" checked={checked} onChange={() => toggleTarget(t.key)}
                            style={{ width: 15, height: 15, accentColor: "var(--os-amber)" }} />
                          <span style={{ fontSize: 13, color: "var(--os-text-1)" }}>{t.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Generate Button */}
                <button onClick={handleGenerate} disabled={generateMutation.isPending}
                  style={{ width: "100%", padding: "11px 0", border: "none", borderRadius: 8, background: "var(--os-amber)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: generateMutation.isPending ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: generateMutation.isPending ? 0.7 : 1 }}>
                  {generateMutation.isPending
                    ? <><Loader2 style={{ width: 16, height: 16 }} className="animate-spin" />AI 撰寫中，請稍候...</>
                    : <><Sparkles style={{ width: 16, height: 16 }} />生成文章</>}
                </button>
              </div>

              {/* Auto Generation */}
              <div style={panelSt}>
                <button onClick={() => setAutoOpen(!autoOpen)}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--os-text-1)" }}>每日自動生成設定</span>
                  <ChevronDown style={{ width: 16, height: 16, color: "var(--os-text-3)", transform: autoOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                </button>

                {autoOpen && (
                  <div className="space-y-4" style={{ marginTop: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--os-text-1)" }}>自動生成</div>
                        <div style={subSt}>開啟後系統每天自動生成草稿</div>
                      </div>
                      <Switch checked={autoEnabled} onCheckedChange={setAutoEnabled} />
                    </div>

                    <div>
                      <label style={labelSt}>生成時間</label>
                      <input type="time" value={autoTime} onChange={(e) => setAutoTime(e.target.value)} style={inputSt} />
                    </div>

                    {[
                      { label: "品牌文章主題", list: brandTopics, setList: setBrandTopics, newVal: newBrandTopic, setNewVal: setNewBrandTopic },
                      { label: "加盟文章主題", list: franchiseTopics, setList: setFranchiseTopics, newVal: newFranchiseTopic, setNewVal: setNewFranchiseTopic },
                    ].map(sec => (
                      <div key={sec.label}>
                        <label style={{ ...labelSt, fontSize: 12 }}>{sec.label}</label>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                          {sec.list.map((t) => (
                            <span key={t} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, background: "var(--os-surface-2)", padding: "3px 8px", borderRadius: 12, color: "var(--os-text-2)" }}>
                              {t}
                              <button onClick={() => sec.setList((prev) => prev.filter((x) => x !== t))}
                                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--os-text-3)", padding: 0, display: "flex" }}>
                                <X style={{ width: 11, height: 11 }} />
                              </button>
                            </span>
                          ))}
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <input value={sec.newVal} onChange={(e) => sec.setNewVal(e.target.value)} placeholder="新增主題"
                            style={{ ...inputSt, fontSize: 12, padding: "6px 10px" }}
                            onKeyDown={(e) => { if (e.key === "Enter" && sec.newVal.trim()) { sec.setList((prev) => [...prev, sec.newVal.trim()]); sec.setNewVal(""); } }} />
                          <button onClick={() => { if (sec.newVal.trim()) { sec.setList((prev) => [...prev, sec.newVal.trim()]); sec.setNewVal(""); } }}
                            style={{ padding: "6px 10px", border: "1px solid var(--os-border)", borderRadius: 8, background: "var(--os-surface-2)", color: "var(--os-text-2)", cursor: "pointer" }}>
                            <Plus style={{ width: 14, height: 14 }} />
                          </button>
                        </div>
                      </div>
                    ))}

                    <button onClick={saveAutoSettings}
                      style={{ padding: "7px 16px", border: "1px solid var(--os-border)", borderRadius: 8, background: "var(--os-surface-2)", color: "var(--os-text-1)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                      儲存設定
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Preview */}
            <div style={{ flex: 1 }} className="flex flex-col gap-4">
              {article ? (
                <>
                  <div style={{ ...panelSt, flex: 1 }} className="space-y-4">
                    {/* Editable Title */}
                    <input value={article.title} onChange={(e) => setArticle({ ...article, title: e.target.value })}
                      style={{ width: "100%", fontSize: 18, fontWeight: 700, color: "var(--os-text-1)", border: "none", borderBottom: "2px solid var(--os-border)", background: "transparent", padding: "4px 0", outline: "none" }} />

                    {/* Category Badge */}
                    {(() => {
                      const cfg = CATEGORY_BADGE[article.category] ?? { color: "var(--os-text-3)", bg: "var(--os-surface-2)" };
                      return (
                        <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 4, fontWeight: 600, color: cfg.color, background: cfg.bg }}>
                          {article.category}
                        </span>
                      );
                    })()}

                    {/* Excerpt */}
                    <div>
                      <label style={{ ...labelSt, fontSize: 11, color: "var(--os-text-3)" }}>摘要</label>
                      <textarea value={article.excerpt} onChange={(e) => setArticle({ ...article, excerpt: e.target.value })} rows={3}
                        style={{ ...inputSt, resize: "none", fontSize: 12, color: "var(--os-text-2)" }} />
                    </div>

                    {/* Content Preview */}
                    <div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                        <label style={{ ...labelSt, fontSize: 11, color: "var(--os-text-3)", margin: 0 }}>內文預覽</label>
                        <span style={{ fontSize: 11, color: "var(--os-text-3)" }}>{countChars(article.content).toLocaleString()} 字</span>
                      </div>
                      <div className="prose prose-sm max-w-none"
                        style={{ border: "1px solid var(--os-border)", borderRadius: 8, padding: "14px 16px", background: "var(--os-surface-2)", maxHeight: 480, overflowY: "auto" }}
                        dangerouslySetInnerHTML={{ __html: article.content }} />
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                    <button onClick={() => handleSave(false)} disabled={saveMutation.isPending}
                      style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 20px", border: "1px solid var(--os-border)", borderRadius: 8, background: "var(--os-surface)", color: "var(--os-text-1)", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: saveMutation.isPending ? 0.6 : 1 }}>
                      {saveMutation.isPending && <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />}存為草稿
                    </button>
                    <button onClick={() => handleSave(true)} disabled={saveMutation.isPending}
                      style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 20px", border: "none", borderRadius: 8, background: "var(--os-amber)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: saveMutation.isPending ? 0.6 : 1 }}>
                      {saveMutation.isPending && <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />}直接發布
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", border: "2px dashed var(--os-border)", borderRadius: 12, minHeight: 400 }}>
                  <div style={{ textAlign: "center", color: "var(--os-text-3)" }}>
                    <Sparkles style={{ width: 48, height: 48, margin: "0 auto 12px", opacity: 0.3 }} />
                    <p style={{ fontSize: 13 }}>生成的文章將顯示在這裡</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminDashboardLayout>
  );
}
