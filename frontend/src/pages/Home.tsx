import { LeaderCard } from "../components/LeaderProfile"
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
            <section className="leader-profile">
            <h2>Leader Profile</h2>

            <div className="Profile">
                <LeaderCard
                name="Shri. Devendra Fadnavis"
                title="Hon. CM, Maharashtra"
                img="/cm.jpg"
                video="/videos/fadnavis.mp4"
                href="/CM-Page"
                label="Open CM page for Shri. Devendra Fadnavis"
                quote="With MITRA we are engaging with more businesses and industries."
                />

                <LeaderCard
                name="Shri. Eknath Shinde"
                title="Hon. DCM, Maharashtra"
                img="/dycmES.jpg"
                video="/videos/shinde.mp4"
                href="/DyCM1-Page"
                label="Open DyCM page for Shri. Eknath Shinde"
                quote="Quote to be updated soon."
                />

                <LeaderCard
                name="Smt. Sunetra Pawar"
                title="Hon. DCM, Maharashtra"
                img="/dycmSP.jpg"
                video="/videos/pawar.mp4"
                href="/DyCM2-Page"
                label="Open DyCM page for Smt. Sunetra Pawar"
                quote="Quote to be updated soon."
                />
            </div>
            </section>
        </div>
    )
}

export default HomePage