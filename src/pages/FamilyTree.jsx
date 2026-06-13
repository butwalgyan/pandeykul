import { useState, useEffect, useRef, useMemo } from "react";
import { familyMemberService, prepareMembersForTree, relationshipService } from "@/services";
import { buildTreeData } from "@/lib/treeLayout";
import { ZoomIn, ZoomOut, Maximize2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import TreeNode from "../components/TreeNode";
import RelationshipFinder from "../components/RelationshipFinder";

export default function FamilyTree() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(0.85);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const displayedIdsRef = useRef(new Set());

  useEffect(() => {
    Promise.all([
      familyMemberService.listApproved(200),
      relationshipService.listSpouseRelationships(500).catch(() => []),
    ])
      .then(([approved, spouseRels]) => {
        const withSpouses = relationshipService.attachSpouseIds(approved, spouseRels);
        setMembers(prepareMembersForTree(withSpouses));
      })
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  }, []);

  const { roots, childrenMap, memberIds } = useMemo(
    () => buildTreeData(members),
    [members],
  );

  displayedIdsRef.current = new Set();

  const handleMouseDown = (e) => { if (e.button === 0) { setDragging(true); setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y }); } };
  const handleMouseMove = (e) => { if (dragging) setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }); };
  const handleMouseUp = () => setDragging(false);
  const handleWheel = (e) => { e.preventDefault(); setZoom(z => Math.max(0.2, Math.min(2, z + (e.deltaY > 0 ? -0.05 : 0.05)))); };

  if (loading) return <div className="flex items-center justify-center h-96"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/50">
        <h1 className="font-heading text-xl font-semibold">Family Tree</h1>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setZoom(z => Math.min(2, z + 0.15))}><ZoomIn className="w-4 h-4" /></Button>
          <span className="text-xs text-muted-foreground w-12 text-center">{Math.round(zoom * 100)}%</span>
          <Button size="sm" variant="outline" onClick={() => setZoom(z => Math.max(0.2, z - 0.15))}><ZoomOut className="w-4 h-4" /></Button>
          <Button size="sm" variant="outline" onClick={() => { setZoom(0.85); setPan({ x: 0, y: 0 }); }}><Maximize2 className="w-4 h-4" /></Button>
          <Link to="/member/new"><Button size="sm" className="gap-1"><Plus className="w-3 h-3" /> Add</Button></Link>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative cursor-grab active:cursor-grabbing bg-[repeating-linear-gradient(0deg,transparent,transparent_19px,hsl(var(--border)/0.3)_20px),repeating-linear-gradient(90deg,transparent,transparent_19px,hsl(var(--border)/0.3)_20px)]"
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <div className="w-full h-full flex items-start justify-center pt-10" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "top center", transition: dragging ? "none" : "transform 0.15s ease" }}>
          {roots.length > 0 ? (
            <ul className="flex gap-12 items-start list-none p-0 m-0">
              {roots.map(root => (
                <TreeNode
                  key={root.id}
                  member={root}
                  childrenMap={childrenMap}
                  allMembers={members}
                  memberIds={memberIds}
                  displayedIds={displayedIdsRef.current}
                />
              ))}
            </ul>
          ) : members.length > 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <p>Approved members exist but parent links (father_id / mother_id) are missing.</p>
              <p className="text-sm mt-2">Add parent relationships when submitting new members.</p>
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-muted-foreground mb-4">No approved family members yet. Add a member and approve the request to see them here.</p>
              <Link to="/member/new"><Button className="gap-2"><Plus className="w-4 h-4" /> Add First Member</Button></Link>
            </div>
          )}
        </div>
      </div>

      {members.length >= 2 && (
        <div className="p-4 border-t border-border bg-card/50">
          <RelationshipFinder members={members} />
        </div>
      )}
    </div>
  );
}
