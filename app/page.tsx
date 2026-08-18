import { getClub } from "@/lib/brawlstars";
import ClubView from "@/components/ClubView";

// Le tag du club affiché sur la page d'accueil se configure via la
// variable d'environnement CLUB_TAG (voir .env.example et le README).
export default async function HomePage() {
  const defaultTag = process.env.CLUB_TAG;

  if (!defaultTag) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 text-center">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">
            Aucun club configuré
          </h1>
          <p className="mt-2 max-w-md text-sm text-ash">
            Ajoute la variable d&apos;environnement <code className="text-zest">CLUB_TAG</code> (ex :
            <code className="text-zest"> #822CL00PG</code>) dans les paramètres Vercel, ou va
            directement sur <code className="text-zest">/clubs/TON_TAG</code>.
          </p>
        </div>
      </main>
    );
  }

  try {
    const club = await getClub(defaultTag);
    return <ClubView club={club} />;
  } catch (err) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 text-center">
        <div>
          <h1 className="font-display text-2xl font-bold text-blush">
            Impossible de charger le club
          </h1>
          <p className="mt-2 max-w-md text-sm text-ash">
            {(err as Error).message}
          </p>
        </div>
      </main>
    );
  }
}
