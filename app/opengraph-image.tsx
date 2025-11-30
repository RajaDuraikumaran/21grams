import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = '21Grams - The Weight of a Single Photo'
export const size = {
    width: 1200,
    height: 630,
}

export const contentType = 'image/png'

export default async function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#09090b',
                    backgroundImage: 'radial-gradient(circle at center, #18181b 0%, #09090b 100%)',
                    fontFamily: 'sans-serif',
                }}
            >
                {/* Decorative Ring */}
                <div
                    style={{
                        position: 'absolute',
                        width: '600px',
                        height: '600px',
                        borderRadius: '50%',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        boxShadow: '0 0 100px rgba(255, 255, 255, 0.05)',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                    }}
                />

                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10,
                    }}
                >
                    <div
                        style={{
                            fontSize: 140,
                            fontWeight: 900,
                            color: 'white',
                            letterSpacing: '-0.05em',
                            lineHeight: 1,
                            marginBottom: 20,
                        }}
                    >
                        21Grams.
                    </div>
                    <div
                        style={{
                            fontSize: 32,
                            color: '#a1a1aa', // zinc-400
                            letterSpacing: '-0.02em',
                            fontWeight: 500,
                        }}
                    >
                        The Weight of a Single Photo.
                    </div>
                </div>
            </div>
        ),
        {
            ...size,
        }
    )
}
