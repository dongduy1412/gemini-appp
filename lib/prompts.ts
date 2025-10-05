import { TransformType } from '@/types'

export const PROMPT_TEMPLATES: Record<TransformType, string> = {
  outfit: `You are a professional virtual try-on assistant. Replace the clothing on the person in the first image with the outfit shown in the second image. Requirements:
- Maintain the person's exact pose, facial expression, and body proportions
- Preserve the original background and lighting
- Make the outfit fit naturally on the person's body
- Match the lighting and shadows realistically
- Keep the outfit's colors and patterns accurate
- Ensure the result looks professional and realistic`,

  interior: `You are a professional interior design assistant. Place the furniture or object from the first image into the room shown in the second image. Requirements:
- Match the scale and proportions appropriately
- Align perspective correctly with the room
- Match lighting conditions (shadows, highlights)
- Ensure the object fits naturally in the space
- Maintain realistic depth and spatial relationships
- Preserve the style and ambiance of the room`,

  headshot: `You are a professional portrait photographer. Transform this casual photo into a professional business headshot. Requirements:
- Enhance lighting to studio-quality standards
- Use a clean, professional background (solid color or subtle blur)
- Improve overall image clarity and sharpness
- Maintain the person's natural appearance and expressions
- Adjust colors for professional look
- Keep facial features and skin tones natural
- Result should be suitable for LinkedIn, CV, or corporate use`,

  background: `You are a professional photo editor. Replace the background of this image while keeping the main subject intact. Requirements:
- Cleanly separate the subject from the background
- Maintain natural edge transitions and lighting
- Match the subject's lighting with the new background
- Preserve all details of the main subject
- Make the composite look seamless and realistic
- Adjust colors and tones for harmony`,
}

export function getPromptForTransform(type: TransformType): string {
  return PROMPT_TEMPLATES[type] || PROMPT_TEMPLATES.headshot
}