import { describe, it, expect } from "vitest";
import { validateWorkout } from "../validateWorkout";
import type { Workout } from "@/types";

function baseWorkout(overrides: Partial<Workout> = {}): Workout {
  return {
    id: "w1",
    name: "Fran",
    createdAt: "2026-01-01T00:00:00.000Z",
    favorite: false,
    blocks: [
      {
        id: "b1",
        type: "forTime",
        durationSeconds: 0,
        exercises: [{ id: "e1", name: "Thrusters", reps: 21 }],
      },
    ],
    ...overrides,
  };
}

describe("validateWorkout", () => {
  it("accepts a valid workout with no errors", () => {
    expect(validateWorkout(baseWorkout())).toEqual([]);
  });

  it("requires a name", () => {
    const errors = validateWorkout(baseWorkout({ name: "" }));
    expect(errors).toContainEqual({ message: "El nombre es obligatorio" });
  });

  it("requires at least one block", () => {
    const errors = validateWorkout(baseWorkout({ blocks: [] }));
    expect(errors).toContainEqual({ message: "Agregá al menos un bloque" });
  });

  it("rejects a block with rounds <= 0 and attaches the block id", () => {
    const workout = baseWorkout({
      blocks: [
        {
          id: "b1",
          type: "interval",
          durationSeconds: 0,
          workSeconds: 20,
          restSeconds: 10,
          rounds: 0,
          exercises: [{ id: "e1", name: "Row" }],
        },
      ],
    });
    expect(validateWorkout(workout)).toContainEqual({
      message: "Las rondas deben ser mayores a 0",
      blockId: "b1",
    });
  });

  it("rejects a block with no exercises and attaches the block id", () => {
    const workout = baseWorkout({
      blocks: [{ id: "b1", type: "amrap", durationSeconds: 600, exercises: [] }],
    });
    expect(validateWorkout(workout)).toContainEqual({
      message: "Cada bloque necesita al menos un ejercicio",
      blockId: "b1",
    });
  });

  it("accepts a basic block with no exercises", () => {
    const workout = baseWorkout({
      blocks: [{ id: "b1", type: "basic", durationSeconds: 0, exercises: [] }],
    });
    expect(validateWorkout(workout)).toEqual([]);
  });

  it("accepts a rest block with no exercises", () => {
    const workout = baseWorkout({
      blocks: [{ id: "b1", type: "rest", durationSeconds: 60, exercises: [] }],
    });
    const errors = validateWorkout(workout);
    expect(errors).not.toContainEqual(
      expect.objectContaining({ blockId: "b1", message: expect.stringMatching(/ejercicio/i) })
    );
  });

  it("accepts a countdown block with no exercises", () => {
    const workout = baseWorkout({
      blocks: [{ id: "b1", type: "countdown", durationSeconds: 60, exercises: [] }],
    });
    const errors = validateWorkout(workout);
    expect(errors).not.toContainEqual(
      expect.objectContaining({ blockId: "b1", message: expect.stringMatching(/ejercicio/i) })
    );
  });

  it("accepts a countup block with no exercises", () => {
    const workout = baseWorkout({
      blocks: [{ id: "b1", type: "countup", durationSeconds: 0, exercises: [] }],
    });
    const errors = validateWorkout(workout);
    expect(errors).not.toContainEqual(
      expect.objectContaining({ blockId: "b1", message: expect.stringMatching(/ejercicio/i) })
    );
  });

  it("rejects an interval block with no exercises", () => {
    const workout = baseWorkout({
      blocks: [
        {
          id: "b1",
          type: "interval",
          durationSeconds: 0,
          workSeconds: 20,
          restSeconds: 10,
          rounds: 4,
          exercises: [],
        },
      ],
    });
    expect(validateWorkout(workout)).toContainEqual({
      message: "Cada bloque necesita al menos un ejercicio",
      blockId: "b1",
    });
  });
});

describe("validateWorkout — otm / fightGoneBad / rm", () => {
  function baseWorkout(overrides: Partial<Workout> = {}): Workout {
    return {
      id: "w1",
      name: "Custom",
      createdAt: "2026-01-01T00:00:00.000Z",
      favorite: false,
      blocks: [],
      ...overrides,
    };
  }

  it("requires rounds > 0 for an otm block", () => {
    const workout = baseWorkout({
      blocks: [
        {
          id: "b1",
          type: "otm",
          durationSeconds: 0,
          workSeconds: 30,
          restSeconds: 0,
          rounds: 0,
          exercises: [{ id: "e1", name: "Burpees" }],
        },
      ],
    });
    expect(validateWorkout(workout)).toContainEqual({
      message: "Las rondas deben ser mayores a 0",
      blockId: "b1",
    });
  });

  it("requires rounds > 0 for a fightGoneBad block", () => {
    const workout = baseWorkout({
      blocks: [
        {
          id: "b1",
          type: "fightGoneBad",
          durationSeconds: 0,
          rounds: 0,
          stationSeconds: 60,
          roundRestSeconds: 60,
          exercises: [{ id: "e1", name: "Wall Ball" }],
        },
      ],
    });
    expect(validateWorkout(workout)).toContainEqual({
      message: "Las rondas deben ser mayores a 0",
      blockId: "b1",
    });
  });

  it("requires a timecap > 0 for an rm block", () => {
    const workout = baseWorkout({
      blocks: [
        {
          id: "b1",
          type: "rm",
          durationSeconds: 0,
          exercises: [{ id: "e1", name: "Push Press" }],
        },
      ],
    });
    expect(validateWorkout(workout)).toContainEqual({
      message: "El timecap debe ser mayor a 0",
      blockId: "b1",
    });
  });
});

describe("validateWorkout — repScheme ladders (spec R3/R7)", () => {
  function ladderBlock(type: Workout["blocks"][number]["type"]): Omit<Workout["blocks"][number], "repScheme"> {
    return {
      id: "b1",
      type,
      durationSeconds: 600,
      rounds: 3,
      // No per-exercise `reps`: under a ladder the block owns the cadencia
      // (spec R3 forbids per-exercise reps on a ladder).
      exercises: [{ id: "e1", name: "Thrusters" }],
    };
  }

  it("accepts a descending ladder with start >= min on an allowed type", () => {
    expect(
      validateWorkout(
        baseWorkout({
          blocks: [
            {
              ...ladderBlock("amrap"),
              rounds: undefined,
              repScheme: { start: 21, step: -3, min: 15 },
            },
          ],
        }),
      ),
    ).toEqual([]);
  });

  it("accepts an ascending ladder with start <= min on an allowed type", () => {
    expect(
      validateWorkout(
        baseWorkout({
          blocks: [{ ...ladderBlock("forTime"), repScheme: { start: 10, step: 5, min: 25 } }],
        }),
      ),
    ).toEqual([]);
  });

  it("accepts repScheme on every allowed type (amrap/forTime/emom/otm)", () => {
    for (const type of ["amrap", "forTime", "emom", "otm"] as const) {
      const errors = validateWorkout(
        baseWorkout({
          blocks: [{ ...ladderBlock(type), repScheme: { start: 21, step: -3, min: 15 } }],
        }),
      );
      expect(errors).not.toContainEqual(expect.objectContaining({ message: /escalera/i }));
    }
  });

  it("rejects a ladder on a forbidden block type", () => {
    for (const type of ["interval", "tabata", "basic", "rest", "rm", "fightGoneBad", "countdown", "countup"] as const) {
      const workout = baseWorkout({
        blocks: [
          {
            ...ladderBlock(type),
            ...(type === "rest" || type === "countdown" || type === "countup" ? { exercises: [] } : {}),
            repScheme: { start: 21, step: -3, min: 15 },
          },
        ],
      });
      expect(validateWorkout(workout)).toContainEqual({
        message: "La escalera solo se usa en bloques AMRAP, FOR TIME, EMOM u OTM",
        blockId: "b1",
      });
    }
  });

  it("rejects step === 0", () => {
    const workout = baseWorkout({
      blocks: [{ ...ladderBlock("amrap"), rounds: undefined, repScheme: { start: 21, step: 0, min: 15 } }],
    });
    expect(validateWorkout(workout)).toContainEqual({
      message: "El paso de la escalera no puede ser 0",
      blockId: "b1",
    });
  });

  it("rejects a descending ladder whose start is below min", () => {
    const workout = baseWorkout({
      blocks: [{ ...ladderBlock("amrap"), rounds: undefined, repScheme: { start: 9, step: -3, min: 15 } }],
    });
    expect(validateWorkout(workout)).toContainEqual({
      message: "En una escalera descendente el inicio debe ser mayor o igual al mínimo",
      blockId: "b1",
    });
  });

  it("rejects an ascending ladder whose start is above min", () => {
    const workout = baseWorkout({
      blocks: [{ ...ladderBlock("forTime"), repScheme: { start: 30, step: 5, min: 25 } }],
    });
    expect(validateWorkout(workout)).toContainEqual({
      message: "En una escalera ascendente el inicio debe ser menor o igual al mínimo",
      blockId: "b1",
    });
  });

  it("rejects a ladder on a chipper (single-round multi-station forTime)", () => {
    const workout = baseWorkout({
      blocks: [
        {
          ...ladderBlock("forTime"),
          rounds: 1,
          exercises: [
            { id: "e1", name: "Run" },
            { id: "e2", name: "L-Sit" },
          ],
          repScheme: { start: 21, step: -3, min: 15 },
        },
      ],
    });
    expect(validateWorkout(workout)).toContainEqual({
      message: "La escalera no se combina con un circuito (chipper)",
      blockId: "b1",
    });
  });

  it("accepts rounds-for-time with a ladder (multi-exercise, rounds > 1)", () => {
    const workout = baseWorkout({
      blocks: [
        {
          ...ladderBlock("forTime"),
          rounds: 3,
          exercises: [
            { id: "e1", name: "Thrusters" },
            { id: "e2", name: "Pull-ups" },
          ],
          repScheme: { start: 21, step: -6, min: 9 },
        },
      ],
    });
    expect(validateWorkout(workout)).toEqual([]);
  });

  it("rejects a per-exercise reps field on any station of a ladder block (spec R3)", () => {
    const workout = baseWorkout({
      blocks: [
        {
          ...ladderBlock("forTime"),
          repScheme: { start: 21, step: -6, min: 9 },
          exercises: [
            { id: "e1", name: "Thrusters", reps: 21 },
            { id: "e2", name: "Pull-ups" },
          ],
        },
      ],
    });
    expect(validateWorkout(workout)).toContainEqual({
      message: 'Con escalera las reps las define el bloque, no "Thrusters"',
      blockId: "b1",
    });
    // The sibling station without reps does not produce the error.
    const messages = validateWorkout(workout).map((error) => error.message);
    expect(messages.filter((message) => message.includes("Con escalera"))).toHaveLength(1);
  });
});

describe("validateWorkout — metric amounts + forTime rounds (spec R7)", () => {
  it("rejects fractional reps", () => {
    const workout = baseWorkout({
      blocks: [
        {
          id: "b1",
          type: "amrap",
          durationSeconds: 600,
          exercises: [{ id: "e1", name: "Thrusters", reps: 12.5 }],
        },
      ],
    });
    expect(validateWorkout(workout)).toContainEqual({
      message: 'Las reps de "Thrusters" deben ser un número entero mayor o igual a 0',
      blockId: "b1",
    });
  });

  it("rejects negative reps", () => {
    const workout = baseWorkout({
      blocks: [
        {
          id: "b1",
          type: "amrap",
          durationSeconds: 600,
          exercises: [{ id: "e1", name: "Thrusters", reps: -1 }],
        },
      ],
    });
    expect(validateWorkout(workout)).toContainEqual({
      message: 'Las reps de "Thrusters" deben ser un número entero mayor o igual a 0',
      blockId: "b1",
    });
  });

  it("accepts decimal distances (spec S decimals: 402.5)", () => {
    const workout = baseWorkout({
      blocks: [
        {
          id: "b1",
          type: "amrap",
          durationSeconds: 600,
          exercises: [{ id: "e1", name: "Run", distanceMeters: 402.5 }],
        },
      ],
    });
    expect(validateWorkout(workout)).toEqual([]);
  });

  it("rejects negative calories", () => {
    const workout = baseWorkout({
      blocks: [
        {
          id: "b1",
          type: "amrap",
          durationSeconds: 600,
          exercises: [{ id: "e1", name: "Row", calories: -50 }],
        },
      ],
    });
    expect(validateWorkout(workout)).toContainEqual({
      message: 'Las calorías de "Row" deben ser un número mayor o igual a 0',
      blockId: "b1",
    });
  });

  it("rejects fractional per-exercise timeSeconds", () => {
    const workout = baseWorkout({
      blocks: [
        {
          id: "b1",
          type: "amrap",
          durationSeconds: 600,
          exercises: [{ id: "e1", name: "L-Sit", timeSeconds: 30.5 }],
        },
      ],
    });
    expect(validateWorkout(workout)).toContainEqual({
      message: 'El tiempo de "L-Sit" debe ser un número entero mayor o igual a 0',
      blockId: "b1",
    });
  });

  it("accepts integer per-exercise timeSeconds", () => {
    const workout = baseWorkout({
      blocks: [
        {
          id: "b1",
          type: "amrap",
          durationSeconds: 600,
          exercises: [{ id: "e1", name: "L-Sit", timeSeconds: 30 }],
        },
      ],
    });
    expect(validateWorkout(workout)).toEqual([]);
  });

  it("rejects a forTime with rounds explicitly below 1", () => {
    const workout = baseWorkout({
      blocks: [
        {
          id: "b1",
          type: "forTime",
          durationSeconds: 600,
          rounds: 0,
          exercises: [{ id: "e1", name: "Thrusters" }],
        },
      ],
    });
    expect(validateWorkout(workout)).toContainEqual({
      message: "Las rondas deben ser mayores a 0",
      blockId: "b1",
    });
  });

  it("accepts a forTime with rounds unset (single pass)", () => {
    const workout = baseWorkout({
      blocks: [
        {
          id: "b1",
          type: "forTime",
          durationSeconds: 600,
          exercises: [{ id: "e1", name: "Thrusters" }],
        },
      ],
    });
    expect(validateWorkout(workout)).toEqual([]);
  });
});
