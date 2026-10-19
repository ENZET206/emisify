import {
  Car, Bus, Plane, Bike, Zap, Gauge, Receipt, AirVent, Monitor, Laptop, Smartphone, Tablet, Tv, Headphones, Watch,
  Refrigerator, Plug, Lightbulb, Thermometer, Wind, BatteryCharging, Sprout, Medal, Repeat, Award, Trophy, Leaf,
} from 'lucide-react';

const ICONS = {
  car: Car, bus: Bus, plane: Plane, bike: Bike, zap: Zap, gauge: Gauge, receipt: Receipt, 'air-vent': AirVent, monitor: Monitor,
  laptop: Laptop, smartphone: Smartphone, tablet: Tablet, tv: Tv, headphones: Headphones, watch: Watch, refrigerator: Refrigerator,
  plug: Plug, lightbulb: Lightbulb, thermometer: Thermometer, wind: Wind, 'battery-charging': BatteryCharging, sprout: Sprout,
  medal: Medal, repeat: Repeat, award: Award, trophy: Trophy,
};

export const getIcon = (name) => ICONS[name] || Leaf;

export const ACTIVITY_ICON = { TRANSPORT: 'car', ELECTRICITY: 'zap', AC: 'air-vent', ELECTRONICS: 'monitor' };

// Tone per activity so categories are distinguishable without relying on colour alone (icons + labels too).
export const ACTIVITY_TONE = {
  TRANSPORT: 'bg-peach/70 text-terracotta',
  ELECTRICITY: 'bg-[#F6E7C8] text-warning',
  AC: 'bg-mint text-forest',
  ELECTRONICS: 'bg-[#EADFD6] text-brown',
};
export const ACTIVITY_COLOR = { TRANSPORT: '#C94A2F', ELECTRICITY: '#D9653F', AC: '#3F684B', ELECTRONICS: '#87905B' };
