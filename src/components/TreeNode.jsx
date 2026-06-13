import { Link } from "react-router-dom";
import { User, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import {
  collectUnitChildren,
  getDisplayPartners,
  groupChildrenForMember,
} from "@/lib/treeLayout";

const LINE = "bg-border shrink-0";

function MemberCard({ member, highlighted, size = "md" }) {
  const isMale = member.gender === "male";
  const isFemale = member.gender === "female";
  const isHighlighted = highlighted?.has(member.id);

  const borderColor = isHighlighted
    ? "border-primary ring-2 ring-primary/30"
    : isMale ? "border-blue-200"
    : isFemale ? "border-pink-200"
    : "border-border";

  const avatarBg = isMale ? "bg-blue-50" : isFemale ? "bg-pink-50" : "bg-accent";

  if (size === "sm") {
    return (
      <Link to={`/member/${member.id}`}
        className={`block bg-card border-2 ${borderColor} rounded-xl px-3 py-2 min-w-[110px] text-center shadow-sm hover:shadow-md transition-all`}>
        <div className={`w-8 h-8 rounded-full ${avatarBg} mx-auto mb-1 flex items-center justify-center overflow-hidden border border-border`}>
          {member.profile_photo
            ? <img src={member.profile_photo} className="w-full h-full object-cover" />
            : <User className="w-4 h-4 text-muted-foreground" />}
        </div>
        <p className="font-heading text-xs font-semibold leading-tight text-foreground">{member.full_name}</p>
        {member.date_of_birth && (
          <p className="text-[9px] text-muted-foreground mt-0.5">{member.date_of_birth.slice(0, 4)}</p>
        )}
      </Link>
    );
  }

  return (
    <Link to={`/member/${member.id}`}
      className={`block bg-card border-2 ${borderColor} rounded-xl px-4 py-3 min-w-[130px] text-center shadow-sm hover:shadow-md transition-all`}>
      <div className={`w-11 h-11 rounded-full ${avatarBg} mx-auto mb-2 flex items-center justify-center overflow-hidden border border-border`}>
        {member.profile_photo
          ? <img src={member.profile_photo} className="w-full h-full object-cover" />
          : <User className="w-5 h-5 text-muted-foreground" />}
      </div>
      <p className="font-heading text-sm font-semibold leading-tight text-foreground">{member.full_name}</p>
      {member.date_of_birth && (
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {member.date_of_birth.slice(0, 4)}{member.date_of_death ? ` – ${member.date_of_death.slice(0, 4)}` : ""}
        </p>
      )}
      {member.occupation && (
        <p className="text-[9px] text-primary/70 mt-0.5 truncate max-w-[120px] mx-auto">{member.occupation}</p>
      )}
    </Link>
  );
}

/** Spouses side-by-side with horizontal marriage connector */
function ParentUnit({ member, partners, highlighted }) {
  return (
    <div className="flex items-center flex-wrap justify-center">
      <MemberCard member={member} highlighted={highlighted} />
      {partners.map(partner => (
        <div key={partner.id} className="flex items-center">
          <div className="flex items-center mx-2" aria-hidden>
            <div className={`w-8 h-[2px] ${LINE}`} />
            <span className="text-[10px] text-primary/60 mx-1">♥</span>
            <div className={`w-8 h-[2px] ${LINE}`} />
          </div>
          <MemberCard member={partner} highlighted={highlighted} size="sm" />
        </div>
      ))}
    </div>
  );
}

/** Vertical stem from parent down to sibling rail */
function ParentStem() {
  return <div className={`w-[2px] h-7 ${LINE}`} aria-hidden />;
}

/**
 * Sibling row: horizontal bar between children + vertical drop to each child.
 */
function ChildrenRow({ children, childrenMap, allMembers, memberIds, displayedIds, highlighted }) {
  if (!children?.length) return null;

  const count = children.length;

  return (
    <div className="flex flex-col items-center w-full">
      <div
        className={`relative flex items-start justify-center w-full ${count > 1 ? "gap-0" : ""}`}
        style={{ minWidth: count > 1 ? `${count * 150}px` : undefined }}
      >
        {count > 1 && (
          <div
            className={`absolute top-0 h-[2px] ${LINE} pointer-events-none`}
            style={{
              left: `calc(100% / ${count * 2})`,
              right: `calc(100% / ${count * 2})`,
            }}
            aria-hidden
          />
        )}

        {children.map(child => (
          <div
            key={child.id}
            className="flex flex-1 flex-col items-center min-w-[140px] max-w-[220px] px-2"
          >
            <div className={`w-[2px] h-7 ${LINE}`} aria-hidden />
            <TreeNode
              member={child}
              childrenMap={childrenMap}
              allMembers={allMembers}
              memberIds={memberIds}
              displayedIds={displayedIds}
              highlighted={highlighted}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TreeNode({
  member,
  childrenMap,
  allMembers,
  memberIds,
  displayedIds,
  highlighted,
}) {
  const [collapsed, setCollapsed] = useState(false);

  if (displayedIds.has(member.id)) {
    return null;
  }
  displayedIds.add(member.id);

  const partners = getDisplayPartners(
    member,
    childrenMap[member.id] || [],
    allMembers,
    memberIds,
  );
  partners.forEach(p => displayedIds.add(p.id));

  const unitChildren = collectUnitChildren(member, partners, childrenMap);
  const childGroups = groupChildrenForMember(member, partners, unitChildren);
  const hasChildren = unitChildren.length > 0;

  return (
    <li className="flex flex-col items-center list-none">
      <ParentUnit member={member} partners={partners} highlighted={highlighted} />

      {hasChildren && (
        <button
          type="button"
          onClick={() => setCollapsed(c => !c)}
          className="mt-1 mb-0.5 w-5 h-5 bg-card border border-border rounded-full flex items-center justify-center hover:bg-accent z-10 shadow-sm"
          aria-label={collapsed ? "Expand children" : "Collapse children"}
        >
          {collapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
        </button>
      )}

      {!collapsed && hasChildren && (
        <div className="flex flex-col items-center w-full">
          <ParentStem />
          {childGroups.map((group, gi) => (
            <ChildrenRow
              key={group.partner?.id || `solo-${gi}`}
              children={group.children}
              childrenMap={childrenMap}
              allMembers={allMembers}
              memberIds={memberIds}
              displayedIds={displayedIds}
              highlighted={highlighted}
            />
          ))}
        </div>
      )}
    </li>
  );
}
