// app/favicon.tsx
import {ImageResponse} from 'next/og'
import {Brain} from 'lucide-react'

// Route segment config
export const runtime = 'edge'

// Image metadata
export const size = {
    width: 32,
    height: 32
}

// Image generation
export default function Icon() {
    return new ImageResponse(
        (
            <div
                style={{
                    fontSize: 24,
                    background: 'transparent',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ff0000', // Change this to match your icon color
                }}
            >
                <Brain/>
            </div>
        ),
        {
            ...size,
        }
    )
}
