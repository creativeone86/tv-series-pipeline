import type { ExplainerPlan } from './types';

/** Fixture plan for "Защо Луната не пада върху Земята?" — no LLM required. */
export function moonPocPlan(): ExplainerPlan {
  return {
    title: 'Защо Луната не пада върху Земята?',
    synopsis: 'Луната пада към Земята през цялото време — просто непрекъснато я пропуска, защото се движи встрани.',
    language: 'bg',
    category: 'PHYSICS',
    beats: [
      beat(1, 'HOOK', 'Защо Луната не пада върху Земята?', 'Ask the hook question', 'GUIDE_CHARACTER looks up at a night sky with a question motif', ['GUIDE_CHARACTER', 'QUESTION_MOTIF'], 0.9, 'PUSH_IN'),
      beat(2, 'QUESTION', 'Ако ябълка падне от дърво, защо Луната не пада върху нас?', 'Compare falling apple with Moon', 'GUIDE_CHARACTER holds the question; Earth and Moon small in the sky', ['GUIDE_CHARACTER', 'EARTH', 'MOON'], 0.6, 'PAN'),
      beat(3, 'EXPLANATION', 'Всъщност Луната пада към Земята през цялото време.', 'Moon is falling toward Earth', 'Earth and Moon with a gravity arrow from Moon toward Earth', ['EARTH', 'MOON', 'PHYSICS_ARROW'], 0.95, 'HIGHLIGHT'),
      beat(4, 'MISCONCEPTION', 'Мнозина си мислят, че в космоса няма гравитация. Има — просто няма въздух, който да ни каже.', 'Gravity exists in space', 'Same Earth-Moon, gravity arrow emphasised; empty space background', ['EARTH', 'MOON', 'SPACE_BG', 'PHYSICS_ARROW'], 0.5, 'STATIC'),
      beat(5, 'ANALOGY', 'Представи си, че хвърляш топка. Колкото по-бързо я хвърлиш, толкова по-далеч пада.', 'Faster sideways throw travels farther', 'GUIDE_CHARACTER throws; short then long trajectory', ['GUIDE_CHARACTER', 'PHYSICS_ARROW'], 0.7, 'PAN'),
      beat(6, 'DEMONSTRATION', 'Нютон си представил топ, хвърлен от висока планина. При достатъчна скорост топът никога не удря земята — Земята се извива под него.', 'Newton cannon thought experiment', 'Earth curve + cannon trajectory becoming an orbit', ['EARTH', 'PHYSICS_ARROW'], 0.9, 'REVEAL'),
      beat(7, 'DEMONSTRATION', 'Луната има огромна странична скорост. Докато пада надолу, Земята се извива под нея.', 'Sideways velocity plus gravity', 'Moon velocity arrow plus gravity arrow, curved path starting', ['EARTH', 'MOON', 'PHYSICS_ARROW'], 0.95, 'HIGHLIGHT'),
      beat(8, 'REVEAL', 'Затова Луната непрекъснато пада — и непрекъснато пропуска Земята. Това се нарича орбита.', 'Orbit is continuous missing', 'Closed orbit path around Earth', ['EARTH', 'MOON', 'PHYSICS_ARROW', 'SPACE_BG'], 1, 'ZOOM'),
      beat(9, 'EXPLANATION', 'Гравитацията дърпа навътре. Скоростта дърпа по допирателната. Заедно рисуват кръг.', 'Two arrows make a circle', 'Same frame, both arrows labelled by position not text-in-image', ['EARTH', 'MOON', 'PHYSICS_ARROW'], 0.6, 'STATIC'),
      beat(10, 'EXAMPLE', 'Същото важи за Международната космическа станция. Тя също непрекъснато пада около нас.', 'ISS is falling too', 'Tiny station on a closer orbit', ['EARTH', 'PHYSICS_ARROW', 'SPACE_BG'], 0.4, 'PAN'),
      beat(11, 'EXPLANATION', 'Ако Луната спре да се движи встрани, тогава да — ще падне.', 'Velocity is what saves us', 'Moon with velocity arrow removed, dashed fall line', ['EARTH', 'MOON', 'PHYSICS_ARROW'], 0.7, 'REVEAL'),
      beat(12, 'RECAP', 'Луната не виси магически. Тя пада. Просто Земята се отмества настрани точно навреме — завинаги.', 'Recap: falling and missing', 'GUIDE_CHARACTER, Earth, Moon, orbit — full vocabulary', ['GUIDE_CHARACTER', 'EARTH', 'MOON', 'SPACE_BG', 'PHYSICS_ARROW'], 0.8, 'PUSH_IN'),
    ],
  };
}

function beat(
  order: number,
  purpose: ExplainerPlan['beats'][number]['purpose'],
  narration: string,
  teaching: string,
  visual: string,
  entities: string[],
  importance: number,
  motion: NonNullable<ExplainerPlan['beats'][number]['visualIntent']['motion']>['type'],
): ExplainerPlan['beats'][number] {
  return {
    id: `moon-${String(order).padStart(2, '0')}`,
    order,
    narrationText: narration,
    purpose,
    teachingGoal: teaching,
    visualGoal: visual,
    activeEntities: entities,
    importance,
    visualIntent: {
      type: purpose === 'DEMONSTRATION' || purpose === 'REVEAL' ? 'DIAGRAM' : 'ILLUSTRATION',
      subject: visual,
      teachingGoal: teaching,
      motion: { type: motion },
      generationPrompt: visual,
      activeEntities: entities,
    },
    estimatedDuration: 6,
    factualReviewStatus: 'UNREVIEWED',
  };
}

export function looksLikeMoonTopic(topic: string): boolean {
  const t = (topic || '').toLowerCase();
  return /луната|луна|moon/.test(t) && /земят|earth|пад/.test(t);
}
