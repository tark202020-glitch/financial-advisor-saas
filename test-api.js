async function check() {
    try {
        const res = await fetch('https://jubot.goraebang.com/api/study/recent');
        const data = await res.json();
        console.log("Recent study data:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Fetch error:", e);
    }
}
check();
