import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { listNews } from "@/lib/news";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import NewsComposer from "@/components/NewsComposer";
import NewsPostCard from "@/components/NewsPostCard";
import PageBanner from "@/components/PageBanner";

export const dynamic = "force-dynamic";

function daysSince(iso: string): string {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (d <= 0) return "auj.";
  return `${d} j`;
}

export default async function ActualitesPage() {
  const [session, posts] = await Promise.all([
    getServerSession(authOptions),
    listNews().catch(() => []),
  ]);
  const discordId = (session?.user as { id?: string } | undefined)?.id;
  const admin = isAdmin(discordId);

  const [featured, ...rest] = posts;

  return (
    <>
      <Navbar />
      <main className="min-h-screen animate-fadeInUp px-4 pb-24 sm:px-8 lg:px-16">
        <div className="mx-auto max-w-[1160px]">
          <PageBanner
            kicker="Purple Corp — Le fil"
            title="Actualités"
            intro="Les annonces du club et l'actu Brawl Stars, au fil de l'eau."
            stats={[
              { value: String(posts.length), label: "Publications" },
              {
                value: featured ? daysSince(featured.createdAt) : "—",
                label: "Dernière annonce",
              },
            ]}
          />

          {admin && (
            <div className="mt-4 rounded-2xl border border-dashed border-zest2/35 bg-iris/[0.18] p-5 sm:p-6">
              <p className="mb-1 text-[11px] uppercase tracking-[0.16em] text-zest2">Espace staff</p>
              <p className="mb-4 text-[14.5px] text-steel-400">
                Publier une annonce, un résultat de guerre de clubs ou une note de patch.
              </p>
              <NewsComposer />
            </div>
          )}

          {posts.length === 0 ? (
            <p className="mt-4 rounded-2xl border border-paper/10 bg-panel px-6 py-10 text-sm text-steel-400">
              Aucune actualité pour l&apos;instant.
            </p>
          ) : (
            <>
              <div className="mt-4">
                <NewsPostCard featured post={featured} canDelete={admin} />
              </div>

              {rest.length > 0 && (
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {rest.map((post) => (
                    <NewsPostCard key={post.id} post={post} canDelete={admin} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
