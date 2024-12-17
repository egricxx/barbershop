// Настройка камеры
async function setupCamera() {
    const video = document.getElementById('video');
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;

    await new Promise(resolve => {
        video.onloadedmetadata = () => resolve(video);
    });

    video.play();
    return video;
}

// Определение формы лица
function determineFaceShape(keypoints) {
    const jawWidth = Math.abs(keypoints[234][0] - keypoints[454][0]); // Ширина челюсти
    const faceHeight = Math.abs(keypoints[10][1] - keypoints[152][1]); // Высота лица
    const foreheadWidth = Math.abs(keypoints[10][0] - keypoints[338][0]); // Лоб
    const cheekboneWidth = Math.abs(keypoints[127][0] - keypoints[356][0]); // Скулы

    // Сохраняем размеры для отображения на странице
    return {
        shape: calculateShape(jawWidth, faceHeight, foreheadWidth, cheekboneWidth),
        dimensions: { jawWidth, faceHeight }
    };
}

function calculateShape(jawWidth, faceHeight, foreheadWidth, cheekboneWidth) {
    const ratioWidthToHeight = faceHeight / jawWidth;

    if (jawWidth > cheekboneWidth && foreheadWidth > cheekboneWidth) {
        return 'Квадратное лицо';
    } else if (foreheadWidth > cheekboneWidth && foreheadWidth > jawWidth) {
        return 'Сердцевидное лицо';
    } else if (ratioWidthToHeight > 1.5) {
        return 'Вытянутое лицо';
    } else if (jawWidth > faceHeight && cheekboneWidth > faceHeight) {
        return 'Круглое лицо';
    } else if (cheekboneWidth > jawWidth && faceHeight > foreheadWidth) {
        return 'Треугольное лицо';
    } else if (Math.abs(faceHeight - cheekboneWidth) < 20) {
        return 'Ромбовидное лицо';
    } else {
        return 'Овальное лицо';
    }
}

// Подбор прически
function recommendHairStyle(faceShape) {
    const recommendations = {
        'Круглое лицо': ['Короткая стрижка с асимметрией', 'Каре с удлинением', 'Высокий хвост'],
        'Вытянутое лицо': ['Длинные волнистые волосы', 'Каскад', 'Чёлка для уменьшения длины'],
        'Овальное лицо': ['Любая прическа', 'Средней длины стрижка', 'Кудри и локоны'],
        'Сердцевидное лицо': ['Длинные прямые волосы', 'Боб с удлинением', 'Косая чёлка'],
        'Квадратное лицо': ['Объемные локоны', 'Средняя длина с мягкими волнами', 'Кудри на бок'],
        'Треугольное лицо': ['Каскад с мягкими слоями', 'Длинные локоны с пробором на бок', 'Прическа Бокс'],
        'Ромбовидное лицо': ['Длинные слои', 'Каре с пробором посередине', 'Пикси с объёмной макушкой']
    };

    return recommendations[faceShape] || ['Нет рекомендаций'];
}

// Рисование точек на Canvas
function drawKeypoints(keypoints, context, canvas) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    keypoints.forEach(point => {
        context.beginPath();
        context.arc(point[0], point[1], 2, 0, 2 * Math.PI);
        context.fillStyle = 'red';
        context.fill();
    });
}

// Обновление информации на странице
function updateInfo(faceShape, styles, dimensions) {
    document.getElementById('face-shape').innerText = `Форма лица: ${faceShape}`;
    document.getElementById('hairstyles').innerText = `Рекомендуемые прически: ${styles.join(', ')}`;
    document.getElementById('face-dimensions').innerText =
        `Ширина лица: ${Math.round(dimensions.jawWidth)} px, Высота лица: ${Math.round(dimensions.faceHeight)} px`;
}

// Обработка видео и анализ лица
async function detectFace(video, context, model, canvas) {
    const predictions = await model.estimateFaces(video);

    if (predictions.length > 0) {
        const keypoints = predictions[0].scaledMesh;
        drawKeypoints(keypoints, context, canvas);

        const { shape, dimensions } = determineFaceShape(keypoints);
        const styles = recommendHairStyle(shape);

        updateInfo(shape, styles, dimensions);
    } else {
        updateInfo('не обнаружено', [], { jawWidth: 0, faceHeight: 0 });
    }

    requestAnimationFrame(() => detectFace(video, context, model, canvas));
}

// Запуск камеры и анализа
(async () => {
    const video = await setupCamera();

    const canvas = document.getElementById('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext('2d');
    const model = await facemesh.load();

    detectFace(video, context, model, canvas);
})();
