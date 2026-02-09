import LeaderProfile from "../components/LeaderProfile"
import { ImageCarousel } from "../components/Carousel"
import './Home.css'

function HomePage () {
    return (
        <div className="homepage">
            <ImageCarousel
               images={[
                { src: "/img1.jpg", alt: "First", caption: "First slide" },
                { src: "/img2.jpeg", alt: "Second", caption: "Second slide" },
                { src: "/img2.jpeg", alt: "Third", caption: "Third slide" },
               ]}
            />
            <LeaderProfile/>
        </div>
    )
}

export default HomePage