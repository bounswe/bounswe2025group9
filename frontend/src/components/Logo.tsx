// logo component with image and text
const Logo = () => {
    return (
        <div className="flex items-center justify-center gap-0.5 text-white">
            <img src="/src/assets/logo.png" alt="NutriHub Logo" className="w-16 h-16" />
            <h1 className="text-5xl">
                <span className="font-light">Nutri</span>
                <span className="font-bold">Hub</span>
            </h1>
        </div>
    )
}

export default Logo 