import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'

// main layout component with navbar, content area (outlet), and footer
const MainLayout = () => {
    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow">
                <Outlet />
            </main>
            <Footer />
        </div>
    )
}

export default MainLayout 