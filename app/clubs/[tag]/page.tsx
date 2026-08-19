import { getClub } from "@/lib/brawlstars";
import { clubTags } from "@/lib/clubs";
import ClubView from "@/components/ClubView";
import Navbar from "@/components/Navbar";
import { notFound } from "next/navigation";

export default async function ClubPage({ params }: { params: { tag: string } }) {
  try {
    const club = await getClub(params.tag);

    // Pour situer ce club parmi tous ceux de Purple Corp (son rang par
    // trophées cumulés), on charge aussi les autres — en tolérant l'échec
    // silencieux de l'un d'eux plutôt que de casser toute la page.
    const allTags = clubTags();
    const allClubs = await Promise.all(
      allTags.map(async (tag) => {
        try {
          return await getClub(tag);
        } catch {
          return null;
        }
      })
    );
    const ranked = allClubs
      .filter((c): c is NonNullable<typeof c> => c !== null)
      .sort((a, b) => b.trophies - a.trophies);
    const clubRank = ranked.findIndex((c) => c.tag === club.tag) + 1;

    return (
      <>
        <Navbar />
        <ClubView club={club} clubRank={clubRank || undefined} totalClubs={ranked.length} />
      </>
    );
  } catch (err) {
    console.error(err);
    notFound();
  }
}
