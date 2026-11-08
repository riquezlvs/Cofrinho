"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  ShoppingCart,
  Pill,
  Car,
  Music,
  Utensils,
  Dumbbell,
  Heart,
  Tag,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  CircleDollarSign,
} from "lucide-react";
import { detectBrand, getGoogleFaviconUrl, getAvatarColor } from "@/lib/brands";

interface TransactionIconProps {
  title: string;
  categoryIcon?: string;
  domain?: string;
  type?: "income" | "expense";
  className?: string;
  size?: number;
}

export function TransactionIcon({
  title,
  categoryIcon,
  domain,
  type,
  className = "",
  size = 40,
}: TransactionIconProps) {
  const [imageError, setImageError] = useState(false);

  // 1. Tentar detectar domínio da marca
  const detectedBrand = detectBrand(title);
  const targetDomain = domain || detectedBrand?.domain;

  // 2. Se tiver marca e a imagem ainda não falhou, renderiza o logo via Google Favicon API
  if (targetDomain && !imageError) {
    const faviconUrl = getGoogleFaviconUrl(targetDomain, 128);

    return (
      <div
        className={`relative flex items-center justify-center shrink-0 rounded-full bg-white/10 p-2 overflow-hidden border border-white/10 ${className}`}
        style={{ width: size, height: size }}
        title={`${title} (${targetDomain})`}
      >
        <img
          src={faviconUrl}
          alt={title}
          className="w-full h-full object-contain rounded-sm"
          loading="lazy"
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  // 3. Fallback: Ícones de Objetos / Categorias
  const renderCategoryIcon = () => {
    const iconSize = Math.max(16, Math.floor(size * 0.45));
    const strokeWidth = 1.8;

    switch (categoryIcon?.toLowerCase()) {
      case "pix":
        return type === "income" ? (
          <ArrowDownLeft
            size={iconSize}
            strokeWidth={strokeWidth}
            className="text-[#52e374]"
          />
        ) : (
          <ArrowUpRight
            size={iconSize}
            strokeWidth={strokeWidth}
            className="text-[#52e374]"
          />
        );
      case "pill":
      case "farmacia":
      case "saude":
        return (
          <Pill
            size={iconSize}
            strokeWidth={strokeWidth}
            className="text-red-400"
          />
        );
      case "cart":
      case "mercado":
      case "compras":
        return (
          <ShoppingCart
            size={iconSize}
            strokeWidth={strokeWidth}
            className="text-amber-400"
          />
        );
      case "car":
      case "transporte":
      case "uber":
        return (
          <Car
            size={iconSize}
            strokeWidth={strokeWidth}
            className="text-sky-400"
          />
        );
      case "music":
      case "streaming":
        return (
          <Music
            size={iconSize}
            strokeWidth={strokeWidth}
            className="text-purple-400"
          />
        );
      case "food":
      case "restaurante":
      case "comida":
        return (
          <Utensils
            size={iconSize}
            strokeWidth={strokeWidth}
            className="text-orange-400"
          />
        );
      case "dumbbell":
      case "fitness":
      case "academia":
        return (
          <Dumbbell
            size={iconSize}
            strokeWidth={strokeWidth}
            className="text-yellow-400"
          />
        );
      case "heart":
        return (
          <Heart
            size={iconSize}
            strokeWidth={strokeWidth}
            className="text-pink-400"
          />
        );
      case "card":
        return (
          <CreditCard
            size={iconSize}
            strokeWidth={strokeWidth}
            className="text-blue-400"
          />
        );
      default:
        return null;
    }
  };

  const categoryElement = renderCategoryIcon();
  if (categoryElement) {
    return (
      <div
        className={`flex items-center justify-center shrink-0 rounded-full bg-white/5 border border-white/10 ${className}`}
        style={{ width: size, height: size }}
      >
        {categoryElement}
      </div>
    );
  }

  // 4. Fallback final: Iniciais estilizadas com cor estável gerada pelo nome
  const initial = title.trim().charAt(0).toUpperCase() || "?";
  const bgColor = detectedBrand?.color || getAvatarColor(title);

  return (
    <div
      className={`flex items-center justify-center shrink-0 rounded-full font-semibold text-white shadow-inner select-none ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: bgColor,
        fontSize: Math.floor(size * 0.4),
      }}
      title={title}
    >
      {initial}
    </div>
  );
}
