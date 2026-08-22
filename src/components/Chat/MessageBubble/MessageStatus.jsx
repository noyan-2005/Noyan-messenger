import { Clock } from "lucide-react";
import { IconCheck, IconChecks } from "@tabler/icons-react";

export default function MessageStatus({ status }) {
  switch (status) {
    case "sending":
      return (
        <span className="text-gray-400">
          <Clock
            size={14}
            strokeWidth={2}
          />
        </span>
      );

    case "sent":
      return (
        <IconCheck
          size={17}
          strokeWidth={2}
        />
      );

    case "delivered":
      return (
        <IconChecks
          size={17}
          strokeWidth={2}
        />
      );

    case "seen":
      return (
        <IconChecks
          size={17}
          strokeWidth={2}
          className="text-blue-500"
        />
      );

    case "failed":
      return (
        <span className="font-medium text-red-500">
          !
        </span>
      );

    default:
      return null;
  }
}