import { readFileSync } from "node:fs";

const plan = readFileSync("docs/plans/2026-10-05-cadence.md", "utf8");
const architecture = readFileSync("docs/Cadence-Privacy-Architecture.md", "utf8");
const expectedSteps = [
  "0.1", "0.2", "0.3",
  "1.1", "1.2", "1.3", "1.4", "1.5", "1.6", "1.7", "1.8",
  "2.1", "2.2", "2.3", "2.4", "2.5", "2.6",
  "3.1", "3.2", "5.1", "5.2",
];

const gateSection = plan.split("## Numbered build delivery gates\n")[1]?.split("\n## ")[0];
if (!gateSection) {
  throw new Error("The numbered build delivery gate table is missing.");
}

const plannedSteps = [...gateSection.matchAll(/^\| (\d+\.\d+) \| ([^|]+) \| ([^|]+) \|$/gm)]
  .map(([, step, delivery, privacy]) => {
    if (!delivery.trim() || !privacy.trim()) {
      throw new Error(`Step ${step} needs both a delivery unit and privacy acceptance.`);
    }
    return step;
  });

if (JSON.stringify(plannedSteps) !== JSON.stringify(expectedSteps)) {
  throw new Error(`Build steps differ from the approved sequence: ${plannedSteps.join(", ")}`);
}

for (const step of expectedSteps) {
  if (!architecture.includes(`| ${step} |`)) {
    throw new Error(`Privacy acceptance is missing for build step ${step}.`);
  }
}

console.log(`Validated ${expectedSteps.length} ordered build steps and privacy gates.`);
