import { useState } from "react";
import { trpc } from "../../lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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

const CATEGORY_COLORS: Record<string, string> = {
  餐飲新聞: "bg-blue-100 text-blue-800",
  品牌動態: "bg-green-100 text-green-800",
  加盟快報: "bg-orange-100 text-orange-800",
  集團公告: "bg-purple-100 text-purple-800",
};

function countChars(html: string): number {
  return html.replace(/<[^>]*>/g, "").length;
}

export default function AIWriter() {
  // 左欄設定
  const [topic, setTopic] = useState("");
  const [style, setStyle] = useState<Style>("brand");
  const [useNews, setUseNews] = useState(true);
  const [publishTargets, setPublishTargets] = useState<string[]>(["brand"]);

  // 右欄預覽（可編輯）
  const [article, setArticle] = useState<ArticleResult | null>(null);

  // 每日自動設定（localStorage）
  const [autoOpen, setAutoOpen] = useState(false);
  const [autoEnabled, setAutoEnabled] = useState(() => {
    return localStorage.getItem("aiwriter_auto_enabled") === "true";
  });
  const [autoTime, setAutoTime] = useState(() => {
    return localStorage.getItem("aiwriter_auto_time") ?? "08:00";
  });
  const [brandTopics, setBrandTopics] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("aiwriter_brand_topics") ?? "[]");
    } catch {
      return [];
    }
  });
  const [franchiseTopics, setFranchiseTopics] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("aiwriter_franchise_topics") ?? "[]");
    } catch {
      return [];
    }
  });
  const [newBrandTopic, setNewBrandTopic] = useState("");
  const [newFranchiseTopic, setNewFranchiseTopic] = useState("");

  const generateMutation = trpc.aiWriter.generateArticle.useMutation({
    onSuccess: (data) => {
      setArticle(data);
    },
    onError: (err) => {
      toast.error(`生成失敗：${err.message}`);
    },
  });

  const saveMutation = trpc.aiWriter.saveAsDraft.useMutation({
    onSuccess: (_, variables) => {
      if (variables.published) {
        toast.success("文章已發布！");
      } else {
        toast.success("已存為草稿，請至內容管理審核發布");
      }
    },
    onError: (err) => {
      toast.error(`儲存失敗：${err.message}`);
    },
  });

  function handleGenerate() {
    if (!topic.trim()) {
      toast.error("請輸入文章主題");
      return;
    }
    generateMutation.mutate({ topic, style, useNews });
  }

  function handleSave(published: boolean) {
    if (!article) return;
    saveMutation.mutate({
      title: article.title,
      excerpt: article.excerpt,
      content: article.content,
      category: article.category,
      publishTargets,
      published,
    });
  }

  function saveAutoSettings() {
    localStorage.setItem("aiwriter_auto_enabled", String(autoEnabled));
    localStorage.setItem("aiwriter_auto_time", autoTime);
    localStorage.setItem("aiwriter_brand_topics", JSON.stringify(brandTopics));
    localStorage.setItem("aiwriter_franchise_topics", JSON.stringify(franchiseTopics));
    toast.success("設定已儲存");
  }

  function toggleTarget(target: string) {
    setPublishTargets((prev) =>
      prev.includes(target) ? prev.filter((t) => t !== target) : [...prev, target]
    );
  }

  return (
    <AdminDashboardLayout>
      <div className="flex flex-col lg:flex-row gap-6 min-h-screen">
        {/* 左欄：設定區 */}
        <div className="w-full lg:w-[40%] flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-purple-500" />
              AI 文章助手
            </h1>
            <p className="text-sm text-muted-foreground mt-1">半自動內容生成系統</p>
          </div>

          <Card>
            <CardContent className="pt-6 flex flex-col gap-5">
              {/* 主題 */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="topic">文章主題</Label>
                <Input
                  id="topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="台中早午餐推薦、加盟創業、韓式飯捲"
                  onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                />
              </div>

              {/* 文章風格 */}
              <div className="flex flex-col gap-2">
                <Label>文章風格</Label>
                <RadioGroup
                  value={style}
                  onValueChange={(v) => setStyle(v as Style)}
                  className="flex flex-col gap-2"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="brand" id="style-brand" />
                    <Label htmlFor="style-brand" className="cursor-pointer font-normal">
                      品牌文章
                      <span className="text-xs text-muted-foreground ml-1">（輕鬆活潑）</span>
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="franchise" id="style-franchise" />
                    <Label htmlFor="style-franchise" className="cursor-pointer font-normal">
                      加盟文章
                      <span className="text-xs text-muted-foreground ml-1">（專業正式）</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* 參考時事 */}
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <Label>參考時事新聞</Label>
                  <p className="text-xs text-muted-foreground">
                    開啟後 AI 會參考最新台灣新聞
                  </p>
                </div>
                <Switch
                  checked={useNews}
                  onCheckedChange={setUseNews}
                />
              </div>

              {/* 發布目標 */}
              <div className="flex flex-col gap-2">
                <Label>發布目標</Label>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="target-brand"
                      checked={publishTargets.includes("brand")}
                      onCheckedChange={() => toggleTarget("brand")}
                    />
                    <Label htmlFor="target-brand" className="cursor-pointer font-normal">
                      來點什麼官網
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="target-corporate"
                      checked={publishTargets.includes("corporate")}
                      onCheckedChange={() => toggleTarget("corporate")}
                    />
                    <Label htmlFor="target-corporate" className="cursor-pointer font-normal">
                      宇聯官網
                    </Label>
                  </div>
                </div>
              </div>

              {/* 生成按鈕 */}
              <Button
                size="lg"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                onClick={handleGenerate}
                disabled={generateMutation.isPending}
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    AI 撰寫中，請稍候...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    生成文章
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* 每日自動生成設定 */}
          <Collapsible open={autoOpen} onOpenChange={setAutoOpen}>
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CollapsibleTrigger className="flex items-center justify-between w-full">
                  <CardTitle className="text-sm font-medium">每日自動生成設定</CardTitle>
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground transition-transform ${autoOpen ? "rotate-180" : ""}`}
                  />
                </CollapsibleTrigger>
              </CardHeader>
              <CollapsibleContent>
                <CardContent className="flex flex-col gap-4 pt-0">
                  {/* 開關 */}
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-0.5">
                      <Label>自動生成</Label>
                      <p className="text-xs text-muted-foreground">
                        開啟後系統每天自動生成草稿
                      </p>
                    </div>
                    <Switch checked={autoEnabled} onCheckedChange={setAutoEnabled} />
                  </div>

                  {/* 時間 */}
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="auto-time">生成時間</Label>
                    <Input
                      id="auto-time"
                      type="time"
                      value={autoTime}
                      onChange={(e) => setAutoTime(e.target.value)}
                    />
                  </div>

                  {/* 品牌主題列表 */}
                  <div className="flex flex-col gap-2">
                    <Label className="text-xs">品牌文章主題</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {brandTopics.map((t) => (
                        <span
                          key={t}
                          className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded-full"
                        >
                          {t}
                          <button
                            onClick={() => setBrandTopics((prev) => prev.filter((x) => x !== t))}
                            className="hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={newBrandTopic}
                        onChange={(e) => setNewBrandTopic(e.target.value)}
                        placeholder="新增主題"
                        className="text-sm h-8"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && newBrandTopic.trim()) {
                            setBrandTopics((prev) => [...prev, newBrandTopic.trim()]);
                            setNewBrandTopic("");
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (newBrandTopic.trim()) {
                            setBrandTopics((prev) => [...prev, newBrandTopic.trim()]);
                            setNewBrandTopic("");
                          }
                        }}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* 加盟主題列表 */}
                  <div className="flex flex-col gap-2">
                    <Label className="text-xs">加盟文章主題</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {franchiseTopics.map((t) => (
                        <span
                          key={t}
                          className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded-full"
                        >
                          {t}
                          <button
                            onClick={() =>
                              setFranchiseTopics((prev) => prev.filter((x) => x !== t))
                            }
                            className="hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={newFranchiseTopic}
                        onChange={(e) => setNewFranchiseTopic(e.target.value)}
                        placeholder="新增主題"
                        className="text-sm h-8"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && newFranchiseTopic.trim()) {
                            setFranchiseTopics((prev) => [...prev, newFranchiseTopic.trim()]);
                            setNewFranchiseTopic("");
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (newFranchiseTopic.trim()) {
                            setFranchiseTopics((prev) => [...prev, newFranchiseTopic.trim()]);
                            setNewFranchiseTopic("");
                          }
                        }}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <Button size="sm" variant="outline" onClick={saveAutoSettings}>
                    儲存設定
                  </Button>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </div>

        {/* 右欄：預覽區 */}
        <div className="w-full lg:w-[60%] flex flex-col gap-4">
          {article ? (
            <>
              <Card className="flex-1">
                <CardContent className="pt-6 flex flex-col gap-4">
                  {/* 標題（可編輯） */}
                  <Input
                    value={article.title}
                    onChange={(e) => setArticle({ ...article, title: e.target.value })}
                    className="text-xl font-bold border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-auto py-1"
                  />

                  {/* 分類標籤 */}
                  <div>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        CATEGORY_COLORS[article.category] ?? "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {article.category}
                    </span>
                  </div>

                  {/* 摘要（可編輯） */}
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs text-muted-foreground">摘要</Label>
                    <textarea
                      value={article.excerpt}
                      onChange={(e) => setArticle({ ...article, excerpt: e.target.value })}
                      className="w-full text-sm text-muted-foreground border rounded-md px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                      rows={3}
                    />
                  </div>

                  {/* 內文預覽 */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground">內文預覽</Label>
                      <span className="text-xs text-muted-foreground">
                        {countChars(article.content).toLocaleString()} 字
                      </span>
                    </div>
                    <div
                      className="prose prose-sm max-w-none border rounded-md px-4 py-3 bg-muted/30 max-h-[500px] overflow-y-auto"
                      dangerouslySetInnerHTML={{ __html: article.content }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* 底部操作列 */}
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => handleSave(false)}
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  存為草稿
                </Button>
                <Button
                  onClick={() => handleSave(true)}
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  直接發布
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-xl min-h-[400px]">
              <div className="text-center text-muted-foreground">
                <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">生成的文章將顯示在這裡</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminDashboardLayout>
  );
}
