"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { OptionCard } from "./OptionCard";

interface QuestionnaireSuiteProps {
  onComplete: (selections: { food: string; vibe: string; qualifier: string }) => void;
  onBack?: () => void;
}

// Simple icons
const SushiIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <ellipse cx="12" cy="15" rx="8" ry="4" />
    <path d="M4 15V9c0-2.2 3.6-4 8-4s8 1.8 8 4v6" />
  </svg>
);

const PastaIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M12 2v10M10 2v10M14 2v10" />
    <path d="M6 12c0 4.4 2.7 8 6 8s6-3.6 6-8" />
  </svg>
);

const ArcadeIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <rect x="5" y="3" width="14" height="18" rx="2" />
    <path d="M9 17h6" />
  </svg>
);

const MoviesIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M9 5v14M15 5v14" />
  </svg>
);

const SparkIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M12 2l2.4 5.6 5.6 2.4-5.6 2.4-2.4 5.6-2.4-5.6-5.6-2.4 5.6-2.4L12 2z" />
  </svg>
);

const TargetIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="4" />
  </svg>
);

const CoffeeIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
    <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
  </svg>
);

const FizzIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M12 2v20M17 5v14M7 8v10" />
  </svg>
);

const SweatIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M4 4h16v16H4z" />
  </svg>
);

const FancyIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5" />
  </svg>
);

export const QuestionnaireSuite: React.FC<QuestionnaireSuiteProps> = ({
  onComplete,
  onBack,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [selections, setSelections] = useState<{
    food?: string;
    vibe?: string;
    qualifier?: string;
    drink?: string;
    dressCode?: string;
  }>({});

  // Steps built for 9th-grade level, simple and college-student style
  const steps = [
    {
      id: "food",
      label: "STEP 1: FOOD VIBES",
      question: "WHAT ARE WE EATING?",
      options: [
        {
          label: "Sushi (raw fish and rice vibes)",
          value: "sushi",
          description: "Fresh cuts, chopsticks, and soy sauce.",
          icon: <SushiIcon />,
        },
        {
          label: "Pasta (noodles and carb overload)",
          value: "pasta",
          description: "Warm carbs, rich sauce, and full bellies.",
          icon: <PastaIcon />,
        },
      ],
    },
    {
      id: "vibe",
      label: "STEP 2: THE FUN",
      question: "WHAT ARE WE DOING AFTER?",
      options: [
        {
          label: "Arcade (let's play games)",
          value: "arcade",
          description: "Neon lights, joysticks, and setting high scores.",
          icon: <ArcadeIcon />,
        },
        {
          label: "Movie (sitting in the dark)",
          value: "movies",
          description: "Popcorn, big screens, and late night walks.",
          icon: <MoviesIcon />,
        },
      ],
    },
    {
      id: "qualifier",
      label: "STEP 3: HOW WE ALIGN",
      question: "HOW DO WE ALIGN?",
      options: [
        {
          label: "Super chill and random",
          value: "chaotic",
          description: "We wing it. No plans, just vibes.",
          icon: <SparkIcon />,
        },
        {
          label: "Planned out and organized",
          value: "focused",
          description: "Everything scheduled. Solid blueprint.",
          icon: <TargetIcon />,
        },
      ],
    },
    {
      id: "drink",
      label: "STEP 4: HYDRATION",
      question: "DRINK OF CHOICE?",
      options: [
        {
          label: "Coffee / Matcha (caffeine life)",
          value: "caffeine",
          description: "Energy booster, cozy cups.",
          icon: <CoffeeIcon />,
        },
        {
          label: "Soda / Wine (something bubbly)",
          value: "fizzy",
          description: "Fizzy sips and sparkling textures.",
          icon: <FizzIcon />,
        },
      ],
    },
    {
      id: "dressCode",
      label: "STEP 5: DRESS CODE",
      question: "WHAT ARE YOU WEARING?",
      options: [
        {
          label: "Sweatpants & cozy hoodies",
          value: "sweats",
          description: "100% comfy, absolute relaxation.",
          icon: <SweatIcon />,
        },
        {
          label: "Dressed up but comfy",
          value: "fancy",
          description: "Slightly elevated, styling it up.",
          icon: <FancyIcon />,
        },
      ],
    },
  ];

  const handleOptionSelect = (value: string) => {
    const stepKey = steps[currentStep].id as keyof typeof selections;
    const updatedSelections = { ...selections, [stepKey]: value };
    setSelections(updatedSelections);

    // Save choices to localStorage
    localStorage.setItem("kj_waitlist_selections", JSON.stringify(updatedSelections));

    setTimeout(() => {
      if (currentStep < steps.length - 1) {
        setDirection(1);
        setCurrentStep((prev) => prev + 1);
      } else {
        // Map 5 inputs to the 3 main database parameters
        onComplete({
          food: updatedSelections.food || "sushi",
          vibe: updatedSelections.vibe || "arcade",
          qualifier: updatedSelections.qualifier || "chaotic",
        });
      }
    }, 280);
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep((prev) => prev - 1);
    } else if (onBack) {
      onBack();
    }
  };

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir < 0 ? 100 : -100,
      opacity: 0,
    }),
  };

  const currentActiveStep = steps[currentStep];

  return (
    <div className="w-full max-w-md mx-auto flex flex-col min-h-[480px] justify-between p-6 bg-white border-4 border-black shadow-[8px_8px_0px_#000]">
      {/* Navigation Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-1.5 text-black hover:text-orange-500 font-extrabold tracking-wider text-xs py-1"
          >
            ← BACK
          </button>
          
          <span className="text-[10px] font-extrabold tracking-widest text-black border-2 border-black bg-yellow-350 bg-yellow-400 px-3 py-1">
            {currentActiveStep.label}
          </span>
        </div>

        {/* Colorful Rainbow Progress Bar */}
        <div className="w-full h-5 border-4 border-black bg-neutral-100 overflow-hidden">
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
            className="h-full bg-gradient-to-r from-red-500 via-orange-500 via-yellow-400 to-blue-500"
          />
        </div>
      </div>

      {/* Body Questions */}
      <div className="my-auto py-6 overflow-hidden relative">
        <AnimatePresence initial={false} mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 25 },
              opacity: { duration: 0.15 },
            }}
            className="flex flex-col gap-5"
          >
            <div className="flex flex-col gap-1.5">
              <h2 className="text-2xl font-black font-bubbles tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-500 to-blue-600 drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)] py-1">
                {currentActiveStep.question}
              </h2>
            </div>

            <div className="flex flex-col gap-4">
              {currentActiveStep.options.map((option) => {
                const stepKey = currentActiveStep.id as keyof typeof selections;
                const isSelected = selections[stepKey] === option.value;
                return (
                  <OptionCard
                    key={option.value}
                    label={option.label}
                    description={option.description}
                    value={option.value}
                    isSelected={isSelected}
                    onClick={() => handleOptionSelect(option.value)}
                    icon={option.icon}
                  />
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Retro Footer */}
      <div className="flex justify-center border-t-2 border-black pt-4">
        <p className="text-[10px] tracking-wider text-black font-black uppercase">
          PLANNING UNDERWAY • VIBE SELECTION
        </p>
      </div>
    </div>
  );
};
