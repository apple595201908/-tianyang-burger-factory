export type StationRole = "base" | "fill" | "player" | "inspector";
export type StationAction = "place" | "skip" | "cap" | "push" | "stamp";

export const ACTION_CLASSES = [
  "acting-place",
  "acting-skip",
  "acting-cap",
  "acting-push",
  "acting-stamp",
] as const;

export const ACTION_MS = {
  place: 500,
  skip: 400,
  cap: 440,
  push: 520,
  stamp: 360,
} as const;

const STATIONS: readonly StationRole[] = ["base", "fill", "player", "inspector"];

export class CharacterActionDirector {
  private readonly timers = new Map<StationRole, number>();

  public play(
    station: StationRole,
    action: StationAction,
    durationMs: number = ACTION_MS[action],
  ): void {
    const element = document.querySelector(`#worker-${station}`);
    if (!element) return;
    ACTION_CLASSES.forEach((className) => element.classList.remove(className));
    void (element as SVGElement).getBoundingClientRect();
    element.classList.add(`acting-${action}`);
    const previous = this.timers.get(station);
    if (previous) window.clearTimeout(previous);
    const timeoutId = window.setTimeout(() => {
      element.classList.remove(`acting-${action}`);
      this.timers.delete(station);
    }, durationMs);
    this.timers.set(station, timeoutId);
  }

  public setAnticipating(station: StationRole, on: boolean): void {
    document.querySelector(`#worker-${station}`)?.classList.toggle("anticipating", on);
  }

  public clear(): void {
    this.timers.forEach((id) => window.clearTimeout(id));
    this.timers.clear();
    STATIONS.forEach((station) => {
      const element = document.querySelector(`#worker-${station}`);
      if (!element) return;
      ACTION_CLASSES.forEach((className) => element.classList.remove(className));
      element.classList.remove("anticipating");
    });
  }

  public destroy(): void {
    this.clear();
  }
}
