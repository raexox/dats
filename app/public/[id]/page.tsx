import { PublicMapClientPage } from "./_components/PublicMapClientPage"

interface PublicMapPageProps {
  params: {
    id: string
  }
}

// Mock data for shared map
const mockPublicMap = {
  id: "map_123",
  title: "Banana Production by State",
  description: "Distribution of banana-related data across US states",
  phrase: "bananas",
  geography: "state" as const,
  metric: "production",
  createdBy: "John Doe",
  createdAt: new Date("2026-01-10"),
  views: 342,
}

export async function generateMetadata({ params }: PublicMapPageProps) {
  return {
    title: `${mockPublicMap.title} - Dats`,
    description: mockPublicMap.description,
  }
}

export default function PublicMapPage({ params }: PublicMapPageProps) {
  return <PublicMapClientPage mapId={params.id} />
}
