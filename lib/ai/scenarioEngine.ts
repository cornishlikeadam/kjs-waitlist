"use client";

export interface AgendaItem {
  time: string;
  activity: string;
  details: string;
}

export interface DateManifest {
  title: string;
  subtitle: string;
  narrative: string;
  agenda: AgendaItem[];
  vectorKeys: string[];
}

export function getScenario(
  food: string,
  vibe: string,
  qualifier: string,
  seedString: string = "guest"
): DateManifest {
  const normFood = (food || "sushi").toLowerCase();
  const normVibe = (vibe || "arcade").toLowerCase();
  const normQual = (qualifier || "chaotic").toLowerCase();

  const foodLabel = normFood === "sushi" ? "Sushi" : "Pasta";
  const vibeLabel = normVibe === "arcade" ? "Arcade games" : "Movie sitting";
  const qualLabel = normQual === "chaotic" ? "Super Chill" : "Planned Out";

  const title = `THE PLAN FOR ${seedString.toUpperCase()}`;
  const subtitle = `A very informal outline of what might happen.`;

  const narrative = `Okay, so here's the deal. We're going to get some ${foodLabel} (since you wanted that), and then we're probably doing the ${vibeLabel} thing. But honestly, I'm just gonna wing it. I know some cool spots, but it's a secret. Or maybe I haven't decided yet. Either way, it's gonna be a movie. I'll text you when we get closer to the day to tell you where to go. Just be ready. Imma hit you up!`;

  const agenda: AgendaItem[] = [
    {
      time: "??:??",
      activity: "Meet Up Somewhere",
      details: "Show up at the secret coordinates. I'll text you where later. Don't stress it."
    },
    {
      time: "Later",
      activity: `${foodLabel} Time`,
      details: `We eat some food. Fueling up. You chose ${foodLabel}, so that's the vibe.`
    },
    {
      time: "After That",
      activity: "The Main Event",
      details: `Doing the ${vibeLabel} thing. Let's see if you can actually keep up.`
    },
    {
      time: "End of Night",
      activity: "Imma Hit You Up!",
      details: "We wrap it up. I'll text you. Simple as that."
    }
  ];

  // Base keys for decorative vectors
  const vectorKeys: string[] = [];
  if (normFood === "sushi") {
    vectorKeys.push("sushi", "chopsticks", "fish");
  } else {
    vectorKeys.push("pasta", "wine", "candle");
  }

  if (normVibe === "arcade") {
    vectorKeys.push("joystick", "gamepad", "lightning");
  } else {
    vectorKeys.push("film", "popcorn", "moon");
  }

  vectorKeys.push("sparkles", "star");

  return {
    title,
    subtitle,
    narrative,
    agenda,
    vectorKeys
  };
}
