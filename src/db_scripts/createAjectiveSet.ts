import {databaseRef} from "../firebase";

const statements = ['1. Absent-Minded',
    '2. Affected',
    '3. Ambitious',
    '4. Assertive, Dominant',
    '5. Bossy',
    '6. Calm',
    '7. Cautious',
    '8. Competitive',
    '9. Confident',
    '10. Considerate',
    '11. Cooperation',
    '12. Cruel, Mean',
    '13. Defensive',
    '14. Dependent',
    '15. Disorderly',
    '16. Dissatisfied',
    '17. Dramatic',
    '18. Dull',
    '19. Easily Embarrassed',
    '20. Easily Hurt',
    '21. Energetic',
    '22. Fair-Minded, Objective',
    '23. Feminine',
    '24. Frank',
    '25. Friendly',
    '26. Guileful',
    '27. Helpless',
    '28. Hostile',
    '29. Idealistic',
    '30. Imaginative',
    '31. Impulsive',
    '32. Intelligent',
    '33. Versatile',
    '34. Introspective',
    '35. Jealous',
    '36. Lazy',
    '37. Likable',
    '38. Perservering',
    '39. Personally Charming',
    '40. Reasonable',
    '41. Rebellious',
    '42. Resentful',
    '43. Reserved, Dignified ',
    '44. Restless',
    '45. Sarcastic',
    '46. Poised',
    '47. Self-Controlled',
    '48. Self-Indulgent',
    '49. Selfish',
    '50. Self-Pitying',
    '51. Sense Of Humor',
    '52. Sentimental',
    '53. Shrewd, Clever',
    '54. Sincere',
    '55. Sophisticated',
    '56. Stubborn',
    '57. Suspicious',
    '58. Sympathetic',
    '59. Timid, Submissive',
    '60. Touchy, Irritable',
    '61. Tactless',
    '62. Unconventional',
    '63. Undecided, Confused',
    '64. Unhappy',
    '65. Uninterested, Indifferent',
    '66. Unworthy, Inadequate',
    '67. Warm',
    '68. Withdrawn, Introverted',
    '69. Worried Anxious',
    '70. Wise'];

export function createAdjectiveSet() {
    databaseRef.collection("qSets").doc("adjective_70").set({
        distribution: [10, 10, 10, 10, 10, 10, 10],
        factors: [],
        id: "adjective_70",
        name: "70 Item Adjective Q-Set",
        sortCode: "AJQ",
        statements: Object.fromEntries(statements.map((s, i) => ["AJQ " + ( i < 9 ? "0"+(i+1) : (i+1)), {factors: [], statement: s} ]))
    })

}
