"use client";

import React, { useState } from "react";
import {
  ShoppingCart,
  Pill,
  Car,
  Music,
  Utensils,
  Dumbbell,
  Heart,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  Coffee,
  Bike,
  ShoppingBag,
  Globe,
  Smartphone,
  Zap,
  Wifi,
  Wrench,
  Fuel,
  Bus,
  Tv,
  Gamepad2,
  Plane,
  Gift,
  Briefcase,
  Tag,
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
  size = 48,
}: TransactionIconProps) {
  const [imageError, setImageError] = useState(false);

  // 1. Tentar detectar domínio da marca
  const detectedBrand = detectBrand(title);
  const targetDomain = domain || detectedBrand?.domain;

  // 2. Se tiver marca identificada e a imagem ainda não falhou, renderiza o logo oficial da empresa
  if (targetDomain && !imageError) {
    const faviconUrl = getGoogleFaviconUrl(targetDomain, 128);
    const innerImgSize = Math.max(22, Math.floor(size * 0.58));

    return (
      <div
        className={`relative flex items-center justify-center shrink-0 rounded-full bg-[#1b1c22] border border-white/5 overflow-hidden shadow-inner ${className}`}
        style={{ width: size, height: size }}
        title={`${title} (${detectedBrand?.name || targetDomain})`}
      >
        <img
          src={faviconUrl}
          alt={title}
          style={{ width: innerImgSize, height: innerImgSize }}
          className="object-contain rounded-full"
          loading="lazy"
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  // 3. Fallback: Ícones de Objetos / Categorias
  const renderCategoryIcon = () => {
    const iconSize = Math.max(16, Math.floor(size * 0.44));
    const strokeWidth = 2.0;
    const cat = (categoryIcon || "").toLowerCase();

    switch (cat) {
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
            className="text-rose-400"
          />
        );
      case "cart":
      case "mercado":
      case "supermercado":
      case "compras":
        return (
          <ShoppingCart
            size={iconSize}
            strokeWidth={strokeWidth}
            className="text-orange-400"
          />
        );
      case "coffee":
      case "cafe":
      case "bebida":
        return (
          <Coffee
            size={iconSize}
            strokeWidth={strokeWidth}
            className="text-orange-400"
          />
        );
      case "food":
      case "restaurante":
      case "utensils":
      case "comida":
        return (
          <Utensils
            size={iconSize}
            strokeWidth={strokeWidth}
            className="text-orange-400"
          />
        );
      case "bike":
      case "delivery":
        return (
          <Bike
            size={iconSize}
            strokeWidth={strokeWidth}
            className="text-orange-400"
          />
        );
      case "bag":
      case "shopping":
        return (
          <ShoppingBag
            size={iconSize}
            strokeWidth={strokeWidth}
            className="text-pink-400"
          />
        );
      case "globe":
      case "online":
        return (
          <Globe
            size={iconSize}
            strokeWidth={strokeWidth}
            className="text-pink-400"
          />
        );
      case "smartphone":
      case "eletron":
      case "eletronicos":
        return (
          <Smartphone
            size={iconSize}
            strokeWidth={strokeWidth}
            className="text-pink-400"
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
      case "fuel":
      case "combustivel":
      case "gas":
        return (
          <Fuel
            size={iconSize}
            strokeWidth={strokeWidth}
            className="text-sky-400"
          />
        );
      case "bus":
        return (
          <Bus
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
      case "tv":
      case "cinema":
        return (
          <Tv
            size={iconSize}
            strokeWidth={strokeWidth}
            className="text-purple-400"
          />
        );
      case "gamepad":
      case "jogos":
        return (
          <Gamepad2
            size={iconSize}
            strokeWidth={strokeWidth}
            className="text-indigo-400"
          />
        );
      case "plane":
      case "viagem":
        return (
          <Plane
            size={iconSize}
            strokeWidth={strokeWidth}
            className="text-cyan-400"
          />
        );
      case "dumbbell":
      case "fitness":
      case "academia":
        return (
          <Dumbbell
            size={iconSize}
            strokeWidth={strokeWidth}
            className="text-amber-400"
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
      case "zap":
      case "energia":
      case "luz":
        return (
          <Zap
            size={iconSize}
            strokeWidth={strokeWidth}
            className="text-yellow-400"
          />
        );
      case "wifi":
      case "internet":
        return (
          <Wifi
            size={iconSize}
            strokeWidth={strokeWidth}
            className="text-blue-400"
          />
        );
      case "wrench":
      case "servico":
        return (
          <Wrench
            size={iconSize}
            strokeWidth={strokeWidth}
            className="text-zinc-400"
          />
        );
      case "gift":
        return (
          <Gift
            size={iconSize}
            strokeWidth={strokeWidth}
            className="text-rose-400"
          />
        );
      case "briefcase":
      case "trabalho":
      case "salario":
        return (
          <Briefcase
            size={iconSize}
            strokeWidth={strokeWidth}
            className="text-emerald-400"
          />
        );
      case "tag":
        return (
          <Tag
            size={iconSize}
            strokeWidth={strokeWidth}
            className="text-zinc-400"
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
        className={`flex items-center justify-center shrink-0 rounded-full bg-[#1b1c22] border border-white/5 shadow-inner ${className}`}
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
      className={`flex items-center justify-center shrink-0 rounded-full font-bold text-white shadow-inner select-none ${className}`}
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
