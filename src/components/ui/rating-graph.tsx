"use client"

import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { TrendingUp, Award, Star } from "lucide-react"

const ratingData = [
    { x: 0, y: 150, rating: 800 },
    { x: 50, y: 130, rating: 950 },
    { x: 100, y: 140, rating: 910 },
    { x: 150, y: 100, rating: 1200 },
    { x: 200, y: 110, rating: 1150 },
    { x: 250, y: 60, rating: 1580 },
    { x: 300, y: 40, rating: 1820 },
]

export function RatingGraph() {
    const [currentRating, setCurrentRating] = useState(800)

    // Animate the rating number based on progress
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentRating(prev => {
                if (prev >= 1820) return 1820
                return prev + 12
            })
        }, 30)
        return () => clearInterval(timer)
    }, [])

    const pathD = `M ${ratingData.map(d => `${d.x},${d.y}`).join(" L ")}`

    return (
        <div className="relative group p-8 rounded-3xl border border-border bg-card/40 backdrop-blur-xl overflow-hidden shadow-2xl h-full min-h-140 flex flex-col">
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-1">Performance Track</h3>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black tabular-nums">{currentRating}</span>
                        <span className="text-green-500 font-bold flex items-center text-sm">
                            <TrendingUp className="w-4 h-4 mr-1" /> +240
                        </span>
                    </div>
                </div>
                <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20">
                    <Award className="w-6 h-6" />
                </div>
            </div>

            <div className="relative h-48 w-full mt-4 flex-1">
                <svg viewBox="0 0 300 160" className="w-full h-full overflow-visible">
                    {/* Background Grid Lines */}
                    {[0, 40, 80, 120, 160].map((line) => (
                        <line
                            key={line} x1="0" y1={line} x2="300" y2={line}
                            stroke="currentColor" className="text-border/30" strokeWidth="1"
                        />
                    ))}

                    {/* The Rating Path */}
                    <motion.path
                        d={pathD}
                        fill="none"
                        stroke="var(--color-primary)"
                        strokeWidth="4"
                        strokeLinecap="round"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 2.5, ease: "easeInOut" }}
                    />

                    {/* Pulsing Highlight on the last point */}
                    <motion.circle
                        cx="300" cy="40" r="6"
                        className="fill-primary"
                        initial={{ scale: 0 }}
                        animate={{ scale: [1, 1.5, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                    />
                </svg>

                {/* Floating Rank Badge */}
                <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 1.5 }}
                    className="absolute top-0 right-0 px-3 py-1 bg-purple-500/20 border border-purple-500/40 text-purple-400 text-[10px] font-bold rounded-full backdrop-blur-md"
                >
                    NEW RANK: CANDIDATE MASTER
                </motion.div>
            </div>

            {/* Achievement Popups */}
            <div className="absolute -bottom-2 -left-2 flex gap-2">
                <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 3 }}
                    className="p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg"
                >
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                </motion.div>
            </div>
        </div>
    )
}
