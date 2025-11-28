import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const size = {
    width: 32,
    height: 32,
}

export const contentType = 'image/png'

export default function Icon() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#09090b',
                    borderRadius: '50%',
                    border: '1px solid #27272a',
                }}
            >
                <div
                    style={{
                        fontSize: 14,
                        fontWeight: 'bold',
                        color: 'white',
                        fontFamily: 'sans-serif',
                    }}
                >
                    21
                </div>
            </div>
        ),
        {
            ...size,
        }
    )
}
