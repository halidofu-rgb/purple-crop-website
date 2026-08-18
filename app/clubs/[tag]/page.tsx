import { getClub } from "@/lib/brawlstars";
import ClubView from "@/components/ClubView";
import Navbar from "@/components/Navbar";
import { notFound } from "next/navigation";

export default async function ClubPage({ params }: { params: { tag: string } }) {
  try {
    const club = await getClub(params.tag);
    return (
      <>
        <Navbar />
        <ClubView club={club} />
      </>
    );
  } catch (err) {
    console.error(err);
    notFound();
  }
}
