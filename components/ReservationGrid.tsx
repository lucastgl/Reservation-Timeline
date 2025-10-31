"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";

interface Table {
    id: string;
    name: string;
    sector: string;
}

interface SectorGroup {
    sector: string;
    tables: Table[];
}

const START_HOUR = 11; // 11:00
const END_HOUR = 24; // 00:00 next day represented as 24
const MIN_STEP = 15; // minutes

function pad(n: number) {
    return n.toString().padStart(2, "0");
}

function minutesToLabel(mins: number) {
    const h = Math.floor(mins / 60) % 24;
    const m = mins % 60;
    return `${pad(h)}:${pad(m)}`;
}

function generateTimeSlots() {
    const slots: number[] = [];
    for (let h = START_HOUR; h <= END_HOUR; h++) {
        for (let m = 0; m < 60; m += MIN_STEP) {
            const total = h * 60 + m;
            // stop at END_HOUR:00 (24:00) included
            if (h === END_HOUR && m > 0) continue;
            slots.push(total);
        }
    }
    return slots;
}

const timeSlots = generateTimeSlots();

export default function ReservationGrid({
    groups = defaultGroups(),
}: {
    groups?: SectorGroup[];
}) {
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        // default all expanded
        const initial: Record<string, boolean> = {};
        groups.forEach((g) => (initial[g.sector] = false));
        setCollapsed(initial);
    }, [groups]);

    // current time in minutes since midnight
    const [nowMins, setNowMins] = useState<number>(() => {
        const d = new Date();
        return d.getHours() * 60 + d.getMinutes();
    });

    useEffect(() => {
        const t = setInterval(() => {
            const d = new Date();
            setNowMins(d.getHours() * 60 + d.getMinutes());
        }, 30 * 1000);
        return () => clearInterval(t);
    }, []);

    // width per 15-min step in px
    const stepPx = 48; // tweakable
    const totalWidth = timeSlots.length * stepPx;

    const nowOffset = useMemo(() => {
        // compute offset relative to start
        const start = START_HOUR * 60;
        const minsFromStart = nowMins - start;
        return (minsFromStart / MIN_STEP) * stepPx;
    }, [nowMins]);

    return (
        <div className="w-full h-screen">
            <div className="relative border rounded bg-white shadow-sm h-screen">
                <div className="flex h-screen overflow-y-auto">

                    {/* Left sticky column for table headers */}
                    <div className="sticky left-0 z-20 w-56 shrink-0 bg-green-400">
                        
                        <div className="h-12 border-b flex items-center px-4 font-medium text-zinc-900  ">
                            Mesas / Sectores
                        </div>

                        <div className="overflow-hidden">
                            {groups.map((g) => (
                                <div key={g.sector} className="border-b border-r">
                                    {!collapsed[g.sector] && (
                                        <div>
                                            {g.tables.map((t) => (
                                                <div
                                                    key={t.id}
                                                    className="h-12 flex items-center px-4 border-t text-zinc-900  "
                                                >
                                                    {t.name}/ sector {g.sector}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right timeline area */}
                    <div className="overflow-x-auto overflow-y-hidden" ref={containerRef}>
                        <div style={{ minWidth: totalWidth }}>
                            
                            {/* Header time row (sticky) */}
                            <div className="sticky top-0 z-10 bg-red-300">
                                <div className="h-12 flex items-stretch">
                                    {timeSlots.map((ts, idx) => {
                                        const isHour = ts % 60 === 0;
                                        const is30 = ts % 30 === 0;
                                        return (
                                            <div
                                                key={ts}
                                                style={{ width: stepPx }}
                                                className={`flex items-center justify-center text-xs text-zinc-600 border-r ${isHour ? "font-semibold" : ""
                                                    }`}
                                            >
                                                {is30 || isHour ? minutesToLabel(ts) : ""}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Table rows */}
                            <div>
                                {groups.map((g) => (
                                    <div key={g.sector}>
                                        {!collapsed[g.sector] &&
                                            g.tables.map((t) => (
                                                <div key={t.id} className="relative flex">
                                                    <div className="h-12 flex" style={{ minWidth: totalWidth }}>
                                                        {timeSlots.map((ts) => {
                                                            const isHour = ts % 60 === 0;
                                                            const is30 = ts % 30 === 0;
                                                            return (
                                                                <div
                                                                    key={ts}
                                                                    style={{ width: stepPx }}
                                                                    className={`h-12 border-t border-r shrink-0 ${isHour ? "border-zinc-400" : is30 ? "border-zinc-300" : "border-zinc-200"
                                                                        }`}
                                                                />
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function defaultGroups(): SectorGroup[] {
    return [
        {
            sector: "Interior",
            tables: [
                { id: "t1", name: "Mesa 1", sector: "Interior" },
                { id: "t2", name: "Mesa 2", sector: "Interior" },
                { id: "t3", name: "Mesa 3", sector: "Interior" },
            ],
        },
        {
            sector: "Terraza",
            tables: [
                { id: "t4", name: "Mesa 4", sector: "Terraza" },
                { id: "t5", name: "Mesa 5", sector: "Terraza" },
            ],
        },
    ];
}
