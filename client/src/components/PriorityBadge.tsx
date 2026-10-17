import React from 'react';
import { TicketPriority } from '../types';
import { Flame, AlertCircle, AlertTriangle, ArrowDown } from 'lucide-react';

interface Props {
  priority: TicketPriority;
  showIcon?: boolean;
}

export const PriorityBadge: React.FC<Props> = ({ priority, showIcon = true }) => {
  switch (priority) {
    case 'Critical':
      return (
        <span className="badge badge-critical" title="Critical Priority - Revenue/Availability Blocker">
          {showIcon && <Flame size={12} />}
          Critical
        </span>
      );
    case 'High':
      return (
        <span className="badge badge-high" title="High Priority - Financial or ISBN Issue">
          {showIcon && <AlertCircle size={12} />}
          High
        </span>
      );
    case 'Medium':
      return (
        <span className="badge badge-medium" title="Medium Priority - Standard Query">
          {showIcon && <AlertTriangle size={12} />}
          Medium
        </span>
      );
    case 'Low':
      return (
        <span className="badge badge-low" title="Low Priority - General Inquiry">
          {showIcon && <ArrowDown size={12} />}
          Low
        </span>
      );
    default:
      return <span className="badge">{priority}</span>;
  }
};
