import type { de } from './de';

export const en: typeof de = {
  common: {
    next: 'Next',
    skip: 'Skip',
    stepOf: 'Step {{current}} of {{count}}',
  },
  intro: {
    vision: {
      title: 'You count. You track. And nothing happens?',
      body: "Often it's the small errors: labels, portions and watches are a little off – every single day.",
      calories: 'Calories',
      burned: 'Burned',
      weight: 'Weight',
      relation: '↓ put into relation over weeks',
      resultLabel: 'your month, honestly calculated',
      resultValue: '{{min}} to {{max}} kcal',
      resultSign: 'Plus = ate more than you burned',
      footer:
        'Kcalwaage factors in the margin of error and shows you an honest range instead of false precision – and checks it against your scale.',
      a11y: 'Calories, energy burned and weight put into relation over weeks',
    },
    bigPicture: {
      title: "One bad day doesn't ruin a month.",
      body: 'Get out of all-or-nothing. See what adds up over weeks – in kcal and kg of fat.',
      legendMinus: 'Deficit day',
      legendPizza: 'Pizza night',
      legendEmpty: 'no entry',
      total: '30 days combined',
      fat: 'Fat saved ≈ {{kcal}} kcal',
      theoretical: '(theoretical)',
      footer:
        'The pizza night? Balanced out after 3 days. Days without an entry can count as neutral.',
      a11y: '30 days: 27 deficit days, one pizza night, 2 days without an entry',
    },
  },
};
