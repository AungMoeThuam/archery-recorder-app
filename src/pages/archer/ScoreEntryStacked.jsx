import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../services/api";

export default function ArcherScoreEntryStacked() {
  const { competitionId, roundId } = useParams();
  const navigate = useNavigate();

  const [ranges, setRanges] = useState([]);
  const [rangeScores, setRangeScores] = useState({});
  const [currentRangeId, setCurrentRangeId] = useState(null);
  const [currentEnd, setCurrentEnd] = useState(1);
  const [currentArrow, setCurrentArrow] = useState(1);
  const [expandedRanges, setExpandedRanges] = useState({});
  const [loading, setLoading] = useState(true);

  const arrowOptions = [
    "M",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "X",
  ];

  useEffect(() => {
    (async () => {
      try {
        const rangesData = await api.getRoundRanges(roundId);
        const rangeList = rangesData.ranges || [];
        setRanges(rangeList);

        const scoresObj = {};
        rangeList.forEach((range) => {
          const ends = {};
          const arrows = range.rangeTotalArrowsPerEnd || 3;
          const totalEnds = range.rangeTotalEnds || 1;
          for (let e = 1; e <= totalEnds; e++)
            ends[e] = Array(arrows).fill(null);
          scoresObj[range.rangeID] = ends;
        });
        setRangeScores(scoresObj);

        if (rangeList.length) {
          setCurrentRangeId(rangeList[0].rangeID);
          setExpandedRanges({ [rangeList[0].rangeID]: true });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundId]);

  const getArrowValue = (arrow) => {
    if (arrow === "X") return 10;
    if (arrow === "M") return 0;
    const n = parseInt(arrow, 10);
    return Number.isNaN(n) ? 0 : n;
  };

  const handleCellClick = (rangeId, endNum, arrowIdx) => {
    setCurrentRangeId(rangeId);
    setCurrentEnd(endNum);
    setCurrentArrow(arrowIdx + 1);
    setExpandedRanges((p) => ({ ...p, [rangeId]: true }));
  };

  const handleEnterScore = (score) => {
    if (!currentRangeId) return;
    setRangeScores((prev) => {
      const r = { ...(prev[currentRangeId] || {}) };
      const row = [...(r[currentEnd] || [])];
      row[currentArrow - 1] = score;
      r[currentEnd] = row;
      return { ...prev, [currentRangeId]: r };
    });
    const range = ranges.find((r) => r.rangeID === currentRangeId) || {};
    const arrows = range.rangeTotalArrowsPerEnd || 3;
    const ends = range.rangeTotalEnds || 1;
    if (currentArrow < arrows) setCurrentArrow((c) => c + 1);
    else if (currentEnd < ends) {
      setCurrentEnd((e) => e + 1);
      setCurrentArrow(1);
    }
  };

  const getEndScore = (rangeId, endNum) => {
    const arr = rangeScores[rangeId]?.[endNum] || [];
    return arr.reduce((s, a) => s + getArrowValue(a), 0);
  };

  const getRangeStats = (rangeId) => {
    const range = ranges.find((r) => r.rangeID === rangeId) || {};
    const totalEnds = range.rangeTotalEnds || 0;
    const arrowsPer = range.rangeTotalArrowsPerEnd || 0;
    let totalScore = 0,
      totalX = 0,
      totalTen = 0,
      totalNine = 0;
    for (let e = 1; e <= totalEnds; e++) {
      const row = rangeScores[rangeId]?.[e] || [];
      for (let a = 0; a < arrowsPer; a++) {
        const val = row[a];
        if (!val) continue;
        const v = getArrowValue(val);
        totalScore += v;
        if (val === "X") {
          totalX++;
          totalTen++;
        } else if (val === "10") totalTen++;
        else if (val === "9") totalNine++;
      }
    }
    return { totalScore, totalX, totalTen, totalNine };
  };

  const handleSubmit = () => {
    console.log("staged arrows", rangeScores);
    alert("Staged arrows logged to console (placeholder)");
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (!ranges.length) return <div className="p-4">No ranges configured.</div>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold">Enter Scores</h2>
      <div className="mt-3 space-y-4">
        {ranges.map((range) => {
          const arrowsPerEnd = range.rangeTotalArrowsPerEnd || 3;
          const totalEnds = range.rangeTotalEnds || 1;
          const expanded = !!expandedRanges[range.rangeID];
          const stats = getRangeStats(range.rangeID);
          return (
            <div key={range.rangeID} className="border rounded">
              <div className="flex items-center justify-between p-3">
                <div>
                  <div className="font-medium">
                    Range {range.rangeID} — {range.rangeDistance}m
                  </div>
                  <div className="text-sm text-gray-500">
                    Target {range.rangeTargetSize} — Ends {totalEnds}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm">Score: {stats.totalScore}</div>
                  <button
                    onClick={() =>
                      setExpandedRanges((p) => ({
                        ...p,
                        [range.rangeID]: !p[range.rangeID],
                      }))
                    }
                    className="px-3 py-1 border rounded text-sm"
                  >
                    {expanded ? "Collapse" : "Expand"}
                  </button>
                </div>
              </div>
              {expanded && (
                <div className="p-3 border-t">
                  <div className="space-y-3">
                    {Array.from({ length: totalEnds }, (_, i) => {
                      const endNum = i + 1;
                      return (
                        <div key={endNum} className="flex items-center gap-4">
                          <div className="w-12">End {endNum}</div>
                          <div className="flex gap-2">
                            {Array.from({ length: arrowsPerEnd }, (_, a) => {
                              const val =
                                rangeScores[range.rangeID]?.[endNum]?.[a];
                              const selected =
                                currentRangeId === range.rangeID &&
                                currentEnd === endNum &&
                                currentArrow === a + 1;
                              return (
                                <button
                                  key={a}
                                  onClick={() =>
                                    handleCellClick(range.rangeID, endNum, a)
                                  }
                                  className={
                                    "w-12 h-12 border rounded flex items-center justify-center " +
                                    (selected
                                      ? "bg-blue-600 text-white"
                                      : "bg-white text-black")
                                  }
                                >
                                  {val || "-"}
                                </button>
                              );
                            })}
                          </div>
                          <div className="ml-4">
                            Sum: {getEndScore(range.rangeID, endNum)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <div className="mt-2">
          <div className="mb-2">Quick Entry</div>
          <div className="flex flex-wrap gap-2">
            {arrowOptions.map((opt) => (
              <button
                key={opt}
                onClick={() => handleEnterScore(opt)}
                className="px-3 py-1 border rounded bg-gray-100 hover:bg-gray-200"
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div>
            <strong>Active Range Totals:</strong>
            <div className="ml-2">
              {(() => {
                const s = getRangeStats(currentRangeId);
                return `Score: ${s.totalScore} — X:${s.totalX} Ten:${s.totalTen} 9s:${s.totalNine}`;
              })()}
            </div>
          </div>
          <div className="space-x-2">
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-green-600 text-white rounded"
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
