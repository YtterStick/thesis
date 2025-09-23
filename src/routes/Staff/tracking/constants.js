// constants.js
import {
    washingAnimation,
    unwashedAnimation,
    dryingAnimation,
    foldingAnimation
} from "./components/lottieAnimations";

export const STATUS_ICONS = {
    UNWASHED: { label: "Not Started", animation: unwashedAnimation },
    WASHING: { label: "Washing", animation: washingAnimation },
    WASHED: { label: "Washed", animation: washingAnimation },
    DRYING: { label: "Drying", animation: dryingAnimation },
    DRIED: { label: "Dried", animation: dryingAnimation },
    FOLDING: { label: "Folding", animation: foldingAnimation },
    COMPLETED: { label: "Completed", animation: foldingAnimation },
};

export const STATUS_LABEL_COLORS = {
    UNWASHED: "text-gray-500",
    WASHING: "text-blue-500",
    WASHED: "text-green-500",
    DRYING: "text-orange-500",
    DRIED: "text-green-600",
    FOLDING: "text-orange-600",
    COMPLETED: "text-green-700",
};

export const DEFAULT_DURATION = { washing: 35, drying: 40 };

export const SERVICE_FLOWS = {
    Wash: ["UNWASHED", "WASHING", "WASHED", "COMPLETED"],
    Dry: ["UNWASHED", "DRYING", "DRIED", "FOLDING", "COMPLETED"],
    "Wash & Dry": ["UNWASHED", "WASHING", "WASHED", "DRYING", "DRIED", "FOLDING", "COMPLETED"],
};