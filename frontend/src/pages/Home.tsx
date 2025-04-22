// home page component
import Logo from '../components/Logo'

const Home = () => {
    return (
        <div className="w-full h-screen flex flex-col items-center justify-center gap-8">
            <div className="w-full md:w-3/5 mx-auto text-center">
                <Logo />
            </div>
        </div>
    )
}

export default Home 