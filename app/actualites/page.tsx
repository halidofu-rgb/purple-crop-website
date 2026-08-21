import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { listNews } from "@/lib/news";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import NewsComposer from "@/components/NewsComposer";
import NewsPostCard from "@/components/NewsPostCard";

export const dynamic = "force-dynamic";

export default async function ActualitesPage() {
  const [session, posts] = await Promise.all([
    getServerSession(authOptions),
    listNews().catch(() => []),
  ]);
  const discordId = (session?.user as { id?: string } | undefined)?.id;
  const admin = isAdmin(discordId);

  return (
    <>
      <Navbar />
      <main className="min-h-screen animate-fadeInUp px-4 py-10 sm:px-8 lg:px-16">
        <section className="mx-auto max-w-2xl text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-signal">Purple Corp</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-paper sm:text-5xl">
            Actualités
          </h1>
          <p className="mt-3 text-sm text-steel-400">
            Les annonces du club et l&apos;actu Brawl Stars, au fil de l&apos;eau.
          </p>
        </section>

        <section className="mx-auto mt-10 flex max-w-2xl flex-col gap-4">
          {admin && <NewsComposer />}

          {posts.length === 0 ? (
            <p className="rounded-2xl border border-paper/10 bg-panel px-4 py-8 text-center text-sm text-steel-400">
              Aucune actualité pour l&apos;instant.
            </p>
          ) : (
            posts.map((post) => <NewsPostCard key={post.id} post={post} canDelete={admin} />)
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
