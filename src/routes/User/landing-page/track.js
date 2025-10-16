import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import ServiceTracking from "@/components/ServiceTracking";

const TrackPage = () => {
  const router = useRouter();
  const { search } = router.query;
  const [autoSearchId, setAutoSearchId] = useState("");

  useEffect(() => {
    if (search) {
      // Decode the search parameter and set it for auto-search
      const decodedSearch = decodeURIComponent(search);
      setAutoSearchId(decodedSearch);
      console.log("🔍 Auto-search ID:", decodedSearch);
    }
  }, [search]);

  return (
    <div>
      <ServiceTracking 
        isVisible={true}
        isDarkMode={false}
        autoSearchId={autoSearchId}
      />
    </div>
  );
};

export default TrackPage;