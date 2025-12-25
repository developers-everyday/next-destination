"use client";

import { ExternalLink } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface PassportPinProps {
    name: string;
}

export default function PassportPin({ name }: PassportPinProps) {
    const [isHovered, setIsHovered] = useState(false);

    // Generate a consistent random image based on the location name
    const imageUrl = `https://picsum.photos/seed/${encodeURIComponent(name)}/200/200`;

    const handleOpenLink = (e: React.MouseEvent) => {
        e.stopPropagation();
        window.open(`https://www.google.com/search?q=${encodeURIComponent(name)}`, '_blank');
    };

    return (
        <div
            className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 transition-all duration-300 ease-spring"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                transform: isHovered ? 'translateX(-50%) scale(2.5) translateY(-20px)' : 'translateX(-50%) scale(1)',
                zIndex: isHovered ? 50 : 10,
            }}
        >
            <div className={`
                relative bg-white p-1 pb-4 shadow-xl rotate-3 transform transition-transform
                ${isHovered ? 'rotate-0' : ''}
            `}
                style={{
                    width: '60px',
                    height: 'auto',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)'
                }}
            >
                {/* Visual "Pin" or Tape effect (optional, let's keep it simple first) */}

                {/* Photo Area */}
                <div className="w-full aspect-square bg-gray-200 relative overflow-hidden">
                    <img
                        src={imageUrl}
                        alt={name}
                        className="w-full h-full object-cover"
                    />

                    {/* External Link Overlay */}
                    <div
                        onClick={handleOpenLink}
                        className={`
                            absolute inset-0 bg-black/30 flex items-center justify-center 
                            opacity-0 transition-opacity duration-200 cursor-pointer
                            ${isHovered ? 'opacity-100' : ''}
                        `}
                    >
                        <ExternalLink className="text-white drop-shadow-md" size={16} />
                    </div>
                </div>

                {/* Caption - barely visible at small scale, clearer at large */}
                <div className="mt-1 text-[5px] text-center font-serif text-gray-800 leading-tight uppercase tracking-wider truncate px-1">
                    {name}
                </div>
            </div>
        </div>
    );
}
