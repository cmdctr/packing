// --- Helper Functions ---

// توليد التباديل الفريدة لأبعاد العنصر (تدوير العبوة)
function getItemOrientations(dimensions) {
    const [d1, d2, d3] = dimensions;
    const permutations = [
        [d1, d2, d3], [d1, d3, d2],
        [d2, d1, d3], [d2, d3, d1],
        [d3, d1, d2], [d3, d2, d1]
    ];
    // فلترة التباديل الفريدة فقط
    const uniqueStrings = new Set();
    const uniqueOrientations = [];
    for (const p of permutations) {
        const key = p.join(',');
        if (!uniqueStrings.has(key)) {
            uniqueOrientations.push(p);
            uniqueStrings.add(key);
        }
    }
    return uniqueOrientations;
}

// توليد ثلاثيات العوامل التي تحقق nx * ny * nz = n
function getFactorTriplets(n) {
    const triplets = [];
    for (let i = 1; i <= n; i++) {
        if (n % i === 0) {
            for (let j = i; j <= n; j++) {
                if ((n / i) % j === 0) {
                    const k = n / (i * j);
                    if (Number.isInteger(k) && k >= j) {
                        triplets.push([i, j, k]);
                    }
                }
            }
        }
    }
    return triplets;
}

// توليد جميع التباديل الفريدة لمصفوفة
function getArrayPermutations(arr) {
    if (arr.length === 0) return [[]];
    if (arr.length === 1) return [arr];

    const result = [];
    for (let i = 0; i < arr.length; i++) {
        const current = arr[i];
        const remaining = [...arr.slice(0, i), ...arr.slice(i + 1)];
        const permsOfRemaining = getArrayPermutations(remaining);
        for (const perm of permsOfRemaining) {
            result.push([current, ...perm]);
        }
    }
    // فلترة التباديل الفريدة
    const uniqueStrings = new Set(result.map(p => p.join(',')));
    return Array.from(uniqueStrings).map(s => s.split(',').map(Number));
}

// --- Three.js Visualization ---
// دالة لإنشاء مشهد ثلاثي الأبعاد مع الحاوية والعبوات
function create3DScene(container, cartonDims, itemDims, arrangement) {
												container.innerHTML = '';

												const isMobile = window.innerWidth <= 768;
												const scene = new THREE.Scene();
												scene.background = new THREE.Color(0xf8fafc);
												
												const width = container.clientWidth;
												const height = container.clientHeight;
												
												const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
												camera.position.set(
												    cartonDims.L * (isMobile ? 1.0 : 1.2),
												    cartonDims.H * (isMobile ? 1.2 : 1.5),
												    cartonDims.W * (isMobile ? 1.0 : 1.2)
												);
												camera.lookAt(new THREE.Vector3(cartonDims.L / 2, cartonDims.H / 2, cartonDims.W / 2));

												const renderer = new THREE.WebGLRenderer({
												    antialias: true,
												    powerPreference: "high-performance"
												});
												renderer.setSize(width, height);
												renderer.setPixelRatio(window.devicePixelRatio > 1 ? 1 : window.devicePixelRatio);
												container.appendChild(renderer.domElement);
												
												// Lighting
												const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
												scene.add(ambientLight);
												
												const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
												directionalLight1.position.set(1, 2, 3);
												scene.add(directionalLight1);
												
												// Simplified scene for mobile
												if (!isMobile) {
												    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
												    directionalLight2.position.set(-1, -1, -2);
												    scene.add(directionalLight2);
												    
												    const gridSize = Math.max(cartonDims.L, cartonDims.W) * 1.5;
												    const gridHelper = new THREE.GridHelper(gridSize, gridSize / 2, 0x888888, 0xcccccc);
												    gridHelper.position.y = -0.01;
												    scene.add(gridHelper);
												}
												
												// Carton
												const cartonGeometry = new THREE.BoxGeometry(cartonDims.L * 1, cartonDims.H * 1, cartonDims.W * 1);
												const cartonMaterial = new THREE.MeshPhongMaterial({
												    color: 0x3b82f6,
												    transparent: true,
												    opacity: isMobile ? 0.15 : 0.1,
												    side: THREE.DoubleSide,
												});
												
												const edges = new THREE.EdgesGeometry(cartonGeometry);
												const lineMaterial = new THREE.LineBasicMaterial({ 
												    color: 0x1e40af, 
												    linewidth: isMobile ? 1 : 2 
												});
												const line = new THREE.LineSegments(edges, lineMaterial);
												
												const cartonMesh = new THREE.Mesh(cartonGeometry, cartonMaterial);
												cartonMesh.position.set(cartonDims.L / 8, cartonDims.H / 8, cartonDims.W / 8);
												line.position.copy(cartonMesh.position);
												scene.add(cartonMesh);
												scene.add(line);
												
												// Items
												const [itemL, itemW, itemH] = itemDims;
												const [nx, ny, nz] = arrangement;
												const itemGeometry = new THREE.BoxGeometry((itemL * 0.9), (itemH * 0.9), (itemW * 0.9));
												
												const layerColors = [
												    0xff6b6b, 0x48dbfb, 0x1dd1a1, 
												    0xfeca57, 0x5f27cd, 0xff9ff3
												];
												
												for (let ix = 0; ix < nx; ix++) {
												    for (let iy = 0; iy < nz; iy++) {
												        for (let iz = 0; iz < ny; iz++) {
												            const layerIndex = iy % layerColors.length;
												            const itemMaterial = new THREE.MeshPhongMaterial({ 
												                color: layerColors[layerIndex],
												                specular: 0x111111,
												                shininess: 30
												            });
												    
												            const itemMesh = new THREE.Mesh(itemGeometry, itemMaterial);
												            itemMesh.position.set(
												                ((itemL / 2) + (ix * itemL) - (cartonDims.L * 0.37)),
												                ((itemH / 2) + (iy * itemH) - (cartonDims.H * 0.37)),
												                ((itemW / 2) + (iz * itemW) - (cartonDims.W * 0.37))
												            );
												            scene.add(itemMesh);
												    
												            // Skip edges on mobile for performance
												            if (!isMobile) {
												                const itemEdges = new THREE.EdgesGeometry(itemGeometry);
												                const itemLineMaterial = new THREE.LineBasicMaterial({ 
												                    color: 0x000000,
												                    linewidth: 1,
												                    transparent: true,
												                    opacity: 0.3
												                });
												                const itemLine = new THREE.LineSegments(itemEdges, itemLineMaterial);
												                itemLine.position.copy(itemMesh.position);
												                scene.add(itemLine);
												            }
												        }
												    }
												}

												// Controls
												const controls = new THREE.OrbitControls(camera, renderer.domElement);
												controls.enableDamping = true;
												controls.dampingFactor = 0.1;
												controls.screenSpacePanning = false;
												controls.minDistance = Math.max(cartonDims.L, cartonDims.W, cartonDims.H) * (isMobile ? 0.5 : 0.8);
												controls.maxDistance = Math.max(cartonDims.L, cartonDims.W, cartonDims.H) * (isMobile ? 1.5 : 3);
												
												if ('ontouchstart' in window) {
												    controls.touchRotateSpeed = 0.5;
												    controls.touchZoomSpeed = 0.5;
												    controls.enablePan = false;
											}
												
												function animate() {
												    requestAnimationFrame(animate);
												    controls.update();
												    renderer.render(scene, camera);
												}
												animate();
												
												window.addEventListener('resize', () => {
												    const w = container.clientWidth;
												    const h = container.clientHeight;
												    renderer.setSize(w, h);
												    camera.aspect = w / h;
												    camera.updateProjectionMatrix();
												});
}

// --- Main Calculation Logic ---

document.getElementById('cartonForm').addEventListener('submit', function (event) {
    event.preventDefault();

    const resultsDiv = document.getElementById('results');
    const errorMessageDiv = document.getElementById('errorMessage');
    const solutionsContainer = document.getElementById('solutionsContainer');

    resultsDiv.classList.add('hidden');
    errorMessageDiv.classList.add('hidden');
    errorMessageDiv.textContent = '';
    solutionsContainer.innerHTML = '';

    // قراءة القيم من المدخلات
    const itemL = parseFloat(document.getElementById('itemLength').value).toFixed(1);
    const itemW = parseFloat(document.getElementById('itemWidth').value).toFixed(1);
    const itemH = parseFloat(document.getElementById('itemHeight').value).toFixed(1);
    const numItems = parseInt(document.getElementById('numItems').value).toFixed(0);
    
    // التحقق من صحة المدخلات
    if (
        isNaN(itemL) || isNaN(itemW) || isNaN(itemH) || isNaN(numItems) ||
        itemL <= 0 || itemW <= 0 || itemH <= 0 || numItems <= 0
    ) {
        errorMessageDiv.textContent = 'يرجى إدخال قيم موجبة وصحيحة لجميع الحقول.';
        errorMessageDiv.classList.remove('hidden');
        return;
    }

    const itemOriginalDimensions = [itemL, itemW, itemH];
    const uniqueItemOrientations = getItemOrientations(itemOriginalDimensions);
    const factorTripletsSorted = getFactorTriplets(numItems);

    if (factorTripletsSorted.length === 0 && numItems > 0) {
        factorTripletsSorted.push([1, 1, numItems]);
    } else if (numItems === 1) {
        factorTripletsSorted.push([1, 1, 1]);
    }

    // إيجاد الحلول التي تعطي أقل مساحة سطحية
    let bestSurfaceArea = Infinity;
    let bestSolutions = [];

    for (const currentItemOrientation of uniqueItemOrientations) {
        const [effItemL, effItemW, effItemH] = currentItemOrientation;

        for (const baseFactors of factorTripletsSorted) {
            const permutationsOfFactors = getArrayPermutations(baseFactors);

            for (const currentFactorPermutation of permutationsOfFactors) {
                const [nx, ny, nz] = currentFactorPermutation;

                const cartonL = nx * effItemL;
                const cartonW = ny * effItemW;
                const cartonH = nz * effItemH;

                const currentSA = 2 * (cartonL * cartonW + cartonL * cartonH + cartonW * cartonH);

                if (currentSA < bestSurfaceArea - 1e-6) {
    // وجدت حل أفضل
                    bestSurfaceArea = currentSA;
                    bestSolutions = [{
                        surfaceArea: currentSA,
                        cartonDims: { L: cartonL.toFixed(1), W: cartonW.toFixed(1), H: cartonH.toFixed(1) },
                        itemOrientationUsed: currentItemOrientation,
                        arrangementCounts: [nx, ny, nz]
                    }];
                } else if (Math.abs(currentSA - bestSurfaceArea) < 1e-6) {
    // حل يساوي الحل الأفضل الحالي (تبادل)
                    bestSolutions.push({
                        surfaceArea: currentSA,
                        cartonDims: { L: cartonL, W: cartonW, H: cartonH },
                        itemOrientationUsed: currentItemOrientation,
                        arrangementCounts: [nx, ny, nz]
                    });
                }
            }
        }
    }

    if (bestSolutions.length === 0) {
        errorMessageDiv.textContent = 'لم يتم العثور على حل. يرجى التحقق من المدخلات.';
        errorMessageDiv.classList.remove('hidden');
        return;
    }

    // عرض كل الحلول المثلى مع نموذج ثلاثي الأبعاد
    bestSolutions.forEach((solution, index) => {
        const [nx, ny, nz] = solution.arrangementCounts;
        const [ L, W, H ] = [nx * itemL, ny * itemW, nz * itemH];
        const SA = 2 * (L * W + L * H + W * H);
        
        // إنشاء كتلة للحل
        const solutionBlock = document.createElement('div');
        solutionBlock.className = 'solution-block';

        // نص الحل
        solutionBlock.innerHTML = `
            <div class="solution-header">(الحل ${index + 1})</div>
            <div>المساحة السطحية ${parseFloat(SA).toFixed(1)} سم² (المثالية ${parseFloat(solution.surfaceArea).toFixed(1)} سم²)</div>
        							 	<ul class="list-disc list-inside ml-4 text-gray-600 text-sm">
                <li>العبوات على امتداد الطول<br><span class="ni">${nx}</span> &#10005; ${parseFloat(itemL).toFixed(1)} = ${parseFloat(L).toFixed(1)} سم</li>
                <li>العبوات على امتداد العرض<br><span class="ni">${ny}</span> &#10005; ${parseFloat(itemW).toFixed(1)} = ${parseFloat(W).toFixed(1)} سم</li>
                <li>العبوات على امتداد الارتفاع<br><span class="ni">${nz}</span> &#10005; ${parseFloat(itemH).toFixed(1)} = ${parseFloat(H).toFixed(1)} سم</li>
            </ul>
            <div class="scene-container" id="scene-${index}"></div>
        `;

        solutionsContainer.appendChild(solutionBlock);

        // إنشاء المشهد الثلاثي الأبعاد داخل الحاوية
        const container3D = solutionBlock.querySelector(`#scene-${index}`);
        create3DScene(container3D, { L, W, H }, [itemL, itemW, itemH], [nx, ny, nz]);
    });

    resultsDiv.classList.remove('hidden');
});