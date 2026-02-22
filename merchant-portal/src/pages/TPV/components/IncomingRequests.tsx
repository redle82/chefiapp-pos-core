import React from "react";

interface IncomingRequestsProps {
  restaurantId: string;
  onOrderAccepted: () => void | Promise<void>;
}

export const IncomingRequests = (_props: IncomingRequestsProps) => (
  <div className="hidden">IncomingRequests</div>
);
