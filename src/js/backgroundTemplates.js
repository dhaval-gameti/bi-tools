// backgroundTemplates.js

export const backgroundTemplates = [
    {
        name: 'हल्का क्लासिक (Light Classic)',
        backgroundColor: '#f8f9fa',
        textColor: '#212529',
        imageUrl: 'images/template_light_classic.png'
    },
    {
        name: 'गहरा मॉडर्न (Dark Modern)',
        backgroundColor: '#343a40',
        textColor: '#f8f9fa',
        imageUrl: 'images/template_dark_modern.png'
    },
    {
        name: 'ब्लू वेव्स (Blue Waves)',
        backgroundColor: '#e0f2f7',
        textColor: '#0056b3',
        imageUrl: 'images/template_blue_waves.png'
    },
    {
        name: 'ग्रीन फ़ॉरेस्ट (Green Forest)',
        backgroundColor: '#e6ffe6',
        textColor: '#28a745',
        imageUrl: 'images/template_green_forest.png'
    },
    {
        name: 'पर्पल ड्रीम (Purple Dream)',
        backgroundColor: '#f3e5f5',
        textColor: '#6a1b9a',
        imageUrl: 'images/template_purple_dream.png'
    },
    {
        name: 'रंग-बिरंगा (Color Splash)',
        backgroundColor: 'red',
        textColor: '#6d214f',
        imageUrl: 'images/template_color_splash.png'
    },
    {
        name: 'रेनबो एनिमेशन (Rainbow Animation)',
        backgroundColor: 'linear-gradient(270deg, #ff0080, #7928ca, #00ffff, #00ff6a)',
        textColor: '#ffffff',
        imageUrl: '',
        isAnimated: true
    }
];

export function renderBackgroundTemplates(galleryElementId) {
    const gallery = document.getElementById(galleryElementId);
    if (!gallery) return;

    gallery.innerHTML = ''; // पहले से मौजूद टेम्प्लेट्स साफ करें

    backgroundTemplates.forEach((template, index) => {
        const templateDiv = document.createElement('div');
        templateDiv.className = 'background-template-item card p-2 text-center';
        templateDiv.dataset.index = index;
        templateDiv.style.cursor = 'pointer';
        templateDiv.style.width = '120px';
        templateDiv.style.border = '1px solid #ddd';

        // थंबनेल या रंग बॉक्स
        if (template.imageUrl) {
            const img = document.createElement('img');
            img.src = template.imageUrl;
            img.alt = template.name;
            img.className = 'img-fluid mb-1 rounded';
            img.style.height = '70px';
            img.style.objectFit = 'cover';
            templateDiv.appendChild(img);
        } else {
            const colorBox = document.createElement('div');
            colorBox.style.width = '100%';
            colorBox.style.height = '70px';

            if (template.isAnimated) {
                colorBox.className = 'mb-1 rounded animated-bg'; // CSS से animation
            } else {
                colorBox.style.backgroundColor = template.backgroundColor;
                colorBox.style.border = `1px solid ${template.textColor}`;
                colorBox.className = 'mb-1 rounded';
            }

            templateDiv.appendChild(colorBox);
        }

        const nameSpan = document.createElement('span');
        nameSpan.textContent = template.name;
        nameSpan.style.fontSize = '0.85em';
        nameSpan.style.color = template.textColor;
        templateDiv.appendChild(nameSpan);

        gallery.appendChild(templateDiv);

        // ⬇️ टेम्पलेट क्लिक होने पर पेज का बैकग्राउंड बदलें
        templateDiv.addEventListener('click', () => {
            // एनिमेटेड टेम्पलेट के लिए special handling
            if (template.isAnimated) {
                document.body.style.background = 'linear-gradient(270deg, #ff0080, #7928ca, #00ffff, #00ff6a)';
                document.body.classList.add('animated-bg');
            } else {
                document.body.style.background = template.backgroundColor;
                document.body.classList.remove('animated-bg');
            }

            // टेक्स्ट कलर सेट करें
            document.body.style.color = template.textColor;
        });
    });
}