import React from 'react';
import { TicketStatus } from '../types';
import { CircleDot, Clock, CheckCircle2, Archive } from 'lucide-react';

interface Props {
  status: TicketStatus;
}

export const StatusBadge: React.FC<Props> = ({ status }) => {
  switch (status) {
    case 'Open':
      return (
        <span className="badge badge-open">
          <CircleDot size={12} />
          Open
        </span>
      );
    case 'In Progress':
      return (
        <span className="badge badge-in-progress">
          <Clock size={12} />
          In Progress
        </span>
      );
    case 'Resolved':
      return (
        <span className="badge badge-resolved">
          <CheckCircle2 size={12} />
          Resolved
        </span>
      );
    case 'Closed':
      return (
        <span className="badge badge-closed">
          <Archive size={12} />
          Closed
        </span>
      );
    default:
      return <span className="badge">{status}</span>;
  }
};
