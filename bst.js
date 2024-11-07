/*
  =============================================================
  Author: Julian Manders-Jones
  Date: October 2024
  Project: Binary Search Tree Visualiser
  Repo: https://github.com/iteacher/bstvisualiser

  Description: an interactive tool designed for learners, educators, and developers interested in deepening their understanding of binary search trees. This app offers a dynamic approach to studying BSTs by enabling users to visually interact with and manipulate the tree structure.
  
  © 2024 Julian Manders-Jones. All rights reserved.
  
  This file is part of Binary Search Tree Visualiser.

  MIT License
  You may obtain a copy of the License at [Link to LICENSE file]
  
  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  =============================================================
*/

document.addEventListener('DOMContentLoaded', () => {

            // === Configuration Variables ===
            // let initialNodeRadius = window.innerHeight / 50;

            // === DOM Elements ===
            const treeLayer = document.getElementById('treeLayer');
            const treeContainer = document.getElementById('treeContainer');
            const treeSVG = document.getElementById('treeSVG');
            const edgesGroup = document.getElementById('edges');
            const nodesGroup = document.getElementById('nodes');
            const comparisonBox = document.getElementById('comparisonBox');
            const numbersList = document.getElementById('numbersList');
            const nextButton = document.getElementById('nextButton');
            const container = document.getElementById('traversalsContainer');
            const zoomSlider = document.getElementById('zoomSlider');
            const zoomSliderContainer = document.getElementById('zoomSliderContainer');
            const traversalsPaneHandle = document.getElementById('traversalPaneHandle');
            const randomizeButtonReset = document.getElementById('randomizeButton');
            const createButton = document.getElementById('redrawButton');

            const paneHandle = document.getElementById('paneHandle');
            const leftPane = document.getElementById('leftPane');

            const addButton = document.getElementById('addButton');
            const randomizeButton = document.getElementById('randomizeButton');
            const nodes = document.querySelectorAll('.svg-node');
            const traversalNames = ["In-Order", "Post-Order", "Pre-Order"];

            // === State Variables ===

            let initialNodeRadius = window.innerWidth / 40;

            let numbers = [];
            let index = 0;
            let currentStep = null;
            let bst = null;
            let currentScale = 1;
            let translateX = 0;
            let translateY = 0;
            let isPanning = false;
            let startX = 0;
            let startY = 0;
            let initialTranslateX = 0;
            let initialTranslateY = 0;
            let t_isDragging = false;
            let t_startX, t_startY, t_initialX, t_initialY;

            // Global variable to store the value of the node being deleted
            let deletedNodeValue = null;
            
            // === Node Class ===
            class Node {
                constructor(value) {
                    this.value = value;
                    this.left = null;
                    this.right = null;
                    this.parent = null;
                    this.x = 0;
                    this.y = 0;
                    this.svgElement = null;
                    this.textElement = null;
                }
            }
    
            // === BST Class ===
            class BST {
                constructor(dataType) {
                    this.root = null;
                    this.dataType = dataType; // Store the selected data type
                }
            
                // Compare method remains unchanged
                compare(a, b) {
                    if (this.dataType === 'integer' || this.dataType === 'double' || this.dataType === 'mixed') {
                        return a - b;
                    } else if (this.dataType === 'letter' || this.dataType === 'word') {
                        if (a < b) return -1;
                        if (a > b) return 1;
                        return 0;
                    }
                }
            
                getMaxDepth(node = this.root) {
                    if (node === null) return 0;
                    return 1 + Math.max(this.getMaxDepth(node.left), this.getMaxDepth(node.right));
                }
            
                assignPosition(node, minX, maxX, currentDepth, maxDepth) {
                    if (node === null) return;
                
                    const paddingTop = 30 + initialNodeRadius; // Adjust for larger nodes
                    const paddingBottom = 30 + initialNodeRadius; // Adjust for larger nodes
                    const totalAvailableHeight = treeLayer.clientHeight - paddingTop - paddingBottom;
                
                    const levels = maxDepth;
                
                    const verticalSpacing = totalAvailableHeight / (levels - 1 || 1);
                
                    // Calculate vertical position using the current depth
                    node.y = paddingTop + (currentDepth - 1) * verticalSpacing;
                
                    // Calculate horizontal position
                    node.x = (minX + maxX) / 2;
                
                    // Assign positions to left and right children
                    const minSpacing = 20; // Adjust as needed to prevent overlap
                    this.assignPosition(node.left, minX, node.x - minSpacing, currentDepth + 1, maxDepth);
                    this.assignPosition(node.right, node.x + minSpacing, maxX, currentDepth + 1, maxDepth);
                }
            
                insert(value) {
                    if (this.root === null) {
                        this.root = new Node(value);
                        return this.root;
                    }
            
                    let current = this.root;
                    let parent = null;
            
                    while (current !== null) {
                        parent = current;
                        const comparison = this.compare(value, current.value);
                        if (comparison < 0) {
                            current = current.left;
                        } else if (comparison > 0) {
                            current = current.right;
                        } else {
                            // Duplicate value, ignore
                            return null;
                        }
                    }
            
                    const newNode = new Node(value);
                    newNode.parent = parent;
            
                    if (this.compare(value, parent.value) < 0) {
                        parent.left = newNode;
                    } else {
                        parent.right = newNode;
                    }
            
                    return newNode;
                }
            
                // === New delete Method ===
                delete(value) {
                    this.root = this._deleteRecursively(this.root, value);
                }
            
                _deleteRecursively(node, value) {
                    if (node === null) return null;
            
                    const comparison = this.compare(value, node.value);
            
                    if (comparison < 0) {
                        node.left = this._deleteRecursively(node.left, value);
                        if (node.left) node.left.parent = node;
                    } else if (comparison > 0) {
                        node.right = this._deleteRecursively(node.right, value);
                        if (node.right) node.right.parent = node;
                    } else {
                        // Node found
                        if (node.left === null && node.right === null) {
                            // No children
                            return null;
                        } else if (node.left === null) {
                            // One child (right)
                            node.right.parent = node.parent;
                            return node.right;
                        } else if (node.right === null) {
                            // One child (left)
                            node.left.parent = node.parent;
                            return node.left;
                        } else {
                            // Two children
                            const successor = this.minValueNode(node.right);
                            node.value = successor.value;
                            node.textElement.textContent = successor.value; // Update SVG text
                            node.right = this._deleteRecursively(node.right, successor.value);
                            if (node.right) node.right.parent = node;
                        }
                    }
            
                    return node;
                }
            
                // === New minValueNode Method ===
                minValueNode(node) {
                    let current = node;
                    while (current.left !== null) {
                        current = current.left;
                    }
                    return current;
                }
            }

            // === Helper Functions ===
            function createEdge(parentNode, childNode) {
                const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                line.setAttribute('x1', parentNode.x);
                line.setAttribute('y1', parentNode.y);
                line.setAttribute('x2', childNode.x);
                line.setAttribute('y2', childNode.y);
                line.setAttribute('stroke', 'white');
                line.setAttribute('stroke-width', '2');
                line.classList.add('svg-edge');
                line.setAttribute('data-parent', parentNode.value);
                line.setAttribute('data-child', childNode.value);
                edgesGroup.appendChild(line);
            }

            function createNodeElement(node) {
                // Ensure x and y are set
                if (node.x === undefined || node.y === undefined) {
                    console.error(`Node coordinates not set for value: ${node.value}`);
                    return;
                }
            
                // Create SVG circle for the node
                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circle.setAttribute('cx', node.x);
                circle.setAttribute('cy', node.y);
                circle.setAttribute('r', initialNodeRadius);
                circle.setAttribute('data-value', node.value);
                circle.classList.add('svg-node');
                nodesGroup.appendChild(circle);
                node.svgElement = circle;
            
                // Create SVG text for the node value
                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('x', node.x);
                text.setAttribute('y', node.y);
                text.setAttribute('data-value', node.value);
                text.classList.add('svg-text');
                text.textContent = node.value;
                nodesGroup.appendChild(text);
                node.textElement = text;
            

                // Add event listeners for hover effect
                setupNodeEventListeners(node);

                // Add click event listener for deletion
                node.svgElement.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent triggering other click events
                    confirmDeletion(node);
                });
            
                setTimeout(() => {
                    circle.setAttribute('r', initialNodeRadius);
                }, 100);
            }

            // === Control Functions ===
            function parseNumbers() {
                const input = document.getElementById('numbersInput').value;
                const dataType = document.getElementById('dataTypeSelect').value;
                let parsedNumbers = [];

                switch(dataType) {
                    case 'integer':
                        parsedNumbers = input.split(',').map(num => parseInt(num.trim(), 10)).filter(num => !isNaN(num));
                        break;
                    case 'double':
                        parsedNumbers = input.split(',').map(num => parseFloat(num.trim())).filter(num => !isNaN(num));
                        break;
                    case 'letter':
                        parsedNumbers = input.split(',').map(item => item.trim()).filter(item => /^[A-Za-z]$/.test(item));
                        break;
                    case 'word':
                        parsedNumbers = input.split(',').map(item => item.trim()).filter(item => /^[A-Za-z]+$/.test(item));
                        break;
                    case 'mixed':
                        parsedNumbers = input.split(',').map(item => item.trim()).filter(item => /^[0-9]*\.?[0-9]+$/.test(item));
                        break;
                    default:
                        parsedNumbers = [];
                }

                // Remove duplicates
                numbers = [...new Set(parsedNumbers)];

                // Validation Feedback
                const originalCount = input.split(',').length;
                const parsedCount = numbers.length;

                if (originalCount !== parsedCount) {
                    showStatus(`Some inputs were invalid or duplicates and have been ignored.`);
                } else {
                    showStatus('All inputs are valid and have been added.');
                }
            }

            function updateNumbersList(highlightIndex = null) {
                //numbersList before clearing
                // console.log("numbersList: receiving new list - ", numbers);
                
                numbersList.innerHTML = '';
                textarea.value = numbers.join(', '); // Update the textarea to reflect the current numbers array
            
                for (let i = 0; i < numbers.length; i++) {
                    const numItem = document.createElement('div');
                    numItem.className = 'number-item';
                    numItem.id = `number-${i}`;
                    numItem.innerText = numbers[i];
            
                    // Set data-value attribute
                    numItem.setAttribute('data-value', numbers[i]);
            
                    if (i < index) {
                        // Number has been inserted
                        numItem.classList.add('inserted');
                    }
            
                    if (highlightIndex === i) {
                        numItem.classList.add('current');
                    }
            
                    // Add fade-in effect
                    numItem.classList.add('fade-in');
            
                    numbersList.appendChild(numItem);
                }
                // console.log("numbersList after clearing: ", numbers);

            
            }

            // Function to update button text while preserving SVG
            function updateButtonText(button, newText) {
                console.log("updateButtonText: ", button, newText);
                const textNode = button.querySelector('span'); // Use a span for text
                if (textNode) {
                    textNode.textContent = newText;
                }
            }

            /**
             * Resets the visualization.
             * @param {boolean} shouldUpdateNumbersList - Determines whether to update the numbers list.
             */
            function resetVisualization(shouldUpdateNumbersList = true) {
                // Clear SVG
                edgesGroup.innerHTML = '';
                nodesGroup.innerHTML = '';
            
                // Reset BST with the selected data type
                const dataType = document.getElementById('dataTypeSelect').value;
                bst = new BST(dataType);
                index = 0;
                currentStep = null;
            
                // Run the simulation to determine expected depths
                simulateInsertions();
            
                // Reset UI
                showStatus('Press Start');
                updateButtonText(nextButton, 'Start');
                nextButton.disabled = false;
            
                // Reset Zoom and Pan
                currentScale = 1;
                translateX = 0;
                translateY = 0;
                applyTransform();
                zoomSlider.value = '1';
            
                if (shouldUpdateNumbersList) {
                    // Parse and update numbers
                    parseNumbers();
                    updateNumbersList();
                }
            }

            // Flag to determine if manual resizing has been performed
            let isManuallyResized = false;
        
            // Modify the autoResize function to respect manual resizing
            function autoResize() {
                if (isManuallyResized) return; // Do not auto-resize if manually resized
            
                const textarea = document.getElementById('numbersInput');
                textarea.style.height = 'auto'; // Reset the height
                textarea.style.height = textarea.scrollHeight + '1em'; // Set to scrollHeight
            }
            
            // Attach the autoResize function to the input event for real-time resizing
            //textarea.addEventListener('input', autoResize);
            
            // Attach the autoResize function to the input event for real-time resizing
            const textarea = document.getElementById('numbersInput');
            textarea.addEventListener('input', autoResize);
            
            // Modify the randomizeNumbers function to call autoResize after updating the textarea
            function randomizeNumbers() {
                const dataType = document.getElementById('dataTypeSelect').value;
                const numCount = Math.floor(Math.random() * (12 - 6 + 1)) + 6; // Generate between 6 to 12 items
                const uniqueValues = new Set();
            
                while (uniqueValues.size < numCount) {
                    let value;
                    switch(dataType) {
                        case 'integer':
                            // Generate random integers between -100 and 100
                            value = Math.floor(Math.random() * 201) - 100;
                            break;
                        case 'double':
                            // Generate random doubles between -100.00 and 100.00 with two decimal places
                            value = parseFloat((Math.random() * 200 - 100).toFixed(2));
                            break;
                        case 'letter':
                            // Generate random uppercase letters A-Z
                            value = String.fromCharCode(65 + Math.floor(Math.random() * 26));
                            break;
                        case 'word':
                            // Generate random short words (less than 5 characters)
                            value = generateRandomWord();
                            break;
                        case 'mixed':
                            // Randomly choose between generating an integer or a double
                            if (Math.random() < 0.5) {
                                value = Math.floor(Math.random() * 201) - 100;
                            } else {
                                value = parseFloat((Math.random() * 200 - 100).toFixed(2));
                            }
                            break;
                        default:
                            value = null;
                    }
            
                    // Add the generated value to the set if it's valid
                    if (value !== null) {
                        uniqueValues.add(value);
                    }
                }
            
                // Convert the set to an array
                numbers = Array.from(uniqueValues);
            
                // Update the textarea with the new list
                textarea.value = numbers.join(', ');
            
                // Call autoResize to adjust the height based on new content
                autoResize();
            
                // Reset the visualization with the new list
                resetVisualization();
            }    
            
            function stepForward() {
                console.log("stepForward: ", nextButton.innerText);
                // If button says "Restart", reset the visualization
                if (nextButton.innerText === 'Restart') {
                    resetVisualization();
                    return;
                }
            
                // If button says "Start", reset and start anew
                if (nextButton.innerText === 'Start') {
                    resetVisualization(false); // Don't update numbers list
                    updateButtonText(nextButton, 'Next');
                }
            
                // Proceed with insertion steps
                if (index >= numbers.length) {
                    showStatus("All values have been inserted.");
                    updateButtonText(nextButton, 'Restart');
                    return;
                }
            
                let value = numbers[index];
            
                if (!currentStep) {
                    // Starting a new insertion
                    updateNumbersList(index);
                    currentStep = {
                        value: value,
                        node: bst.root
                    };
            
                    if (bst.root === null) {
                        // Insert root node
                        let newNode = bst.insert(value);
            
                        if (newNode) {
                            // Assign precomputed positions
                            const pos = expectedPositions[String(value)];
                            newNode.x = pos.x;
                            newNode.y = pos.y;
            
                            // Create SVG elements for the new node
                            createNodeElement(newNode);
            
                            showStatus(`Root node placed: ${value}`);
                            index++;
                            currentStep = null;
                            updateNumbersList();
                        }
                    } else {
                        // Highlight root node for comparison
                        highlightNode(bst.root, 'highlighted');
                        showStatus(`Comparing: ${value} with ${bst.root.value}`);
                    }
                } else {
                    let currentNode = currentStep.node;
            
                    const comparison = bst.compare(currentStep.value, currentNode.value);
            
                    if (comparison < 0) {
                        if (currentNode.left === null) {
                            // Insert to the left
                            let newNode = bst.insert(currentStep.value);
            
                            if (newNode) {
                                // Assign precomputed positions
                                const pos = expectedPositions[String(newNode.value)];
                                newNode.x = pos.x;
                                newNode.y = pos.y;
            
                                // Create SVG elements for the new node
                                createNodeElement(newNode);
            
                                // Create edge between parent and new node
                                createEdge(currentNode, newNode);
            
                                highlightNode(newNode, 'new-node');
                                showStatus(`Inserted ${currentStep.value} to the left of ${currentNode.value}`);
                                unhighlightNode(currentNode, 'highlighted');
                                index++;
                                currentStep = null;
                                updateNumbersList();
                            }
                        } else {
                            // Move to left child
                            unhighlightNode(currentNode, 'highlighted');
                            currentStep.node = currentNode.left;
                            showStatus(`Moving left to compare with ${currentStep.node.value}`);
                            highlightNode(currentStep.node, 'highlighted');
                        }
                    } else if (comparison > 0) {
                        if (currentNode.right === null) {
                            // Insert to the right
                            let newNode = bst.insert(currentStep.value);
            
                            if (newNode) {
                                // Assign precomputed positions
                                const pos = expectedPositions[String(newNode.value)];
                                newNode.x = pos.x;
                                newNode.y = pos.y;
            
                                // Create SVG elements for the new node
                                createNodeElement(newNode);
            
                                // Create edge between parent and new node
                                createEdge(currentNode, newNode);
            
                                highlightNode(newNode, 'new-node');
                                showStatus(`Inserted ${currentStep.value} to the right of ${currentNode.value}`);
                                unhighlightNode(currentNode, 'highlighted');
                                index++;
                                currentStep = null;
                                updateNumbersList();
                            }
                        } else {
                            // Move to right child
                            unhighlightNode(currentNode, 'highlighted');
                            currentStep.node = currentNode.right;
                            showStatus(`Moving right to compare with ${currentStep.node.value}`);
                            highlightNode(currentStep.node, 'highlighted');
                        }
                    } else {
                        // Duplicate detected
                        showStatus(`Duplicate value ${currentStep.value} ignored.`);
                        unhighlightNode(currentNode, 'highlighted');
                        index++;
                        currentStep = null;
                        updateNumbersList();
                    }
                }
            
                if (index >= numbers.length && !currentStep) {
                    showStatus("All values have been inserted.");
                    updateButtonText(nextButton, 'Restart');
                }
            }
        
            function setZoom(value) {
                currentScale = parseFloat(value);
                currentScale = Math.min(Math.max(currentScale, 0.5), 2); // Ensure scale is within bounds
                applyTransform();
            }
        
            function applyTransform() {
                treeContainer.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentScale})`;
            }
            
            // === Panning Functions ===
            function enablePanning() {
                treeLayer.addEventListener('mousedown', (e) => {
                    isPanning = true;
                    startX = e.clientX;
                    startY = e.clientY;
                    initialTranslateX = translateX;
                    initialTranslateY = translateY;
                    treeLayer.style.cursor = 'grabbing';
                });
        
                window.addEventListener('mousemove', (e) => {
                    if (!isPanning) return;
                    const deltaX = e.clientX - startX;
                    const deltaY = e.clientY - startY;
                    translateX = initialTranslateX + deltaX;
                    translateY = initialTranslateY + deltaY;
                    applyTransform();
                });
        
                window.addEventListener('mouseup', () => {
                    if (isPanning) {
                        isPanning = false;
                        treeLayer.style.cursor = 'grab';
                    }
                });
            }
        
            // === Touch Events for Panning and Zooming ===
            function enableTouchGestures() {
                let touchStartDistance = 0;
                let initialScaleTouch = currentScale;
                let initialTranslateTouch = { x: 0, y: 0 };
        
                treeLayer.addEventListener('touchstart', (e) => {
                    if (e.touches.length === 1) {
                        // Single finger touch for panning
                        isPanning = true;
                        startX = e.touches[0].clientX;
                        startY = e.touches[0].clientY;
                        initialTranslateX = translateX;
                        initialTranslateY = translateY;
                    } else if (e.touches.length === 2) {
                        // Two fingers touch for zooming
                        isPanning = false;
                        touchStartDistance = getDistance(e.touches[0], e.touches[1]);
                        initialScaleTouch = currentScale;
                        initialTranslateTouch.x = translateX;
                        initialTranslateTouch.y = translateY;
                    }
                });
        
                treeLayer.addEventListener('touchmove', (e) => {
                    e.preventDefault();
                    if (e.touches.length === 1 && isPanning) {
                        const deltaX = e.touches[0].clientX - startX;
                        const deltaY = e.touches[0].clientY - startY;
                        translateX = initialTranslateX + deltaX;
                        translateY = initialTranslateY + deltaY;
                        applyTransform();
                    } else if (e.touches.length === 2) {
                        const currentDistance = getDistance(e.touches[0], e.touches[1]);
                        const scaleFactor = currentDistance / touchStartDistance;
                        currentScale = initialScaleTouch * scaleFactor;
                        currentScale = Math.min(Math.max(currentScale, 0.5), 2); // Clamp between 0.5 and 2
                        applyTransform();
                        zoomSlider.value = currentScale;
                    }
                });
        
                treeLayer.addEventListener('touchend', (e) => {
                    if (e.touches.length < 2) {
                        touchStartDistance = 0;
                    }
                    if (e.touches.length === 0) {
                        isPanning = false;
                    }
                });
            }
        
            function getDistance(touch1, touch2) {
                const dx = touch2.clientX - touch1.clientX;
                const dy = touch2.clientY - touch1.clientY;
                return Math.sqrt(dx * dx + dy * dy);
            }
        
            // === Event Listeners ===
            addButton.addEventListener('click', () => {
                resetVisualization();
            });
        
            randomizeButton.addEventListener('click', () => {
                randomizeNumbers();
            });
        
            nextButton.addEventListener('click', () => {
                stepForward();
            });
        
            // Zoom Slider
            zoomSlider.addEventListener('input', (e) => {
                setZoom(e.target.value);
            });
        
            // Event Listener for the handle click
            traversalsPaneHandle.addEventListener('click', () => {
                container.classList.toggle('open');
            });

            // Event Listener for the handle click
            paneHandle.addEventListener('click', () => {
                leftPane.classList.toggle('open');
            });
        
            // Redraw Button Event Listener
            const redrawButton = document.getElementById('redrawButton');
            
            redrawButton.addEventListener('click', () => {
                redrawButton.disabled = true; // Prevent multiple clicks during the process
            
                const totalDelay = clearNumbersList(); // Start the removal animation
            
                setTimeout(() => {
                    resetVisualization(false); // Don't reset numbers list
            
                    // Insert nodes into the BST
                    insertNodesintoBST();
                    
                    // Parse and update numbers
                    parseNumbers();
                    updateNumbersList();
            
                    showStatus("All inputs have been added.");
                    redrawButton.disabled = false; // Re-enable the button after completion
        
                }, totalDelay); // Wait until all items have been removed
            });    
        
            // Initialize Panning and Touch Gestures
            enablePanning();
            enableTouchGestures();

            //when i change datatTypeSelect it calls initializeDemo
            const dataTypeSelect = document.getElementById('dataTypeSelect');
            dataTypeSelect.addEventListener('change', initializeDemo);
        
            // === Initialization ===
            function initializeDemo() {
                // Get the selected data type from the dropdown
                const dataType = document.getElementById('dataTypeSelect').value;
                
                // Define balanced and duplicate-free lists for each data type
                if (dataType === 'integer') {
                    numbers = [
                        77, 37, 150, 22, 70, 124, 175, 
                        15, 30, 50, 75, 100, 126, 170, 
                        180, 14, 20, 25, 36, 45, 69, 
                        71, 76, 90, 123, 125, 127, 169, 
                        171, 179, 181
                    ];
                } else if (dataType === 'double') {
                    numbers = [
                        77.5, 37.2, 150.1, 22.8, 70.6, 124.3, 175.4, 
                        15.9, 30.7, 50.2, 75.5, 100.4, 126.6, 170.8, 
                        180.3, 14.1, 20.5, 25.2, 36.4, 45.7, 69.9, 
                        71.3, 76.6, 90.8, 123.5, 125.7, 127.9, 169.2, 
                        171.4, 179.6, 181.8
                    ];
                } else if (dataType === 'letter') {
                    numbers = [
                        'N', 'G', 'D', 'B', 'F', 'K', 'I', 'M', 'T', 'Q', 'O', 'R', 
                        'W', 'U', 'X'
                    ];
                    
                } else if (dataType === 'word') {
                    numbers = [
                        'fox', 'can', 'bag', 'ant', 'ace', 'art', 'bed',
                        'bat', 'bug', 'dog', 'cow', 'cat', 'day', 'eat',
                        'ear', 'egg', 'man', 'jam', 'hat', 'fun', 'ice',
                        'kid', 'jar', 'leg', 'rat', 'owl', 'net', 'pig',
                        'toy', 'sun', 'zip'
                    ];
                    
                } else if (dataType === 'mixed') {
                    numbers = [
                        77, 37.5, 150, 22.8, 70, 124.3, 175, 
                        15.9, 30, 50.2, 75, 100.4, 126, 170.8, 
                        180, 14.1, 20, 25.2, 36.4, 45, 69.9, 
                        71, 76.6, 90.8, 123.5, 125.7, 127.9, 169, 
                        171.4, 179.6, 181
                    ];
                }
            
                // Update the textarea with the new list
                textarea.value = numbers.join(', ');
            
                // Call autoResize to adjust the height based on content
                autoResize();
            
                // Reset the visualization with the new list
                resetVisualization();
                updateNumbersList();
            }
        
            // Initialize the demo
            initializeDemo();
        
            // Adjust the tree layer on window resize
            window.addEventListener('resize', () => {
                if (bst.root !== null) {
                    // Recalculate positions using expected depths
                    bst.assignPosition(bst.root, 50, treeLayer.clientWidth - 50, 1, bst.getMaxDepth());
        
                    // Update positions of SVG elements
                    updateSVGElements();
                }
            });

            function clearNumbersList() {
                // Assuming numbersList is the DOM element containing the list of numbers
                numbersList.innerHTML = ''; // Clear the list
            
                // Optionally, return a delay if you have animations
                return 0; // No delay by default
            }
        
            function updateSVGElements() {
                // Update positions of edges
                edgesGroup.querySelectorAll('.svg-edge').forEach(line => {
                    const parentValue = line.getAttribute('data-parent');
                    const childValue = line.getAttribute('data-child');
                    const parentNode = findNodeByValue(bst.root, parentValue);
                    const childNode = findNodeByValue(bst.root, childValue);
        
                    if (parentNode && childNode) {
                        line.setAttribute('x1', parentNode.x);
                        line.setAttribute('y1', parentNode.y);
                        line.setAttribute('x2', childNode.x);
                        line.setAttribute('y2', childNode.y);
                    }
                });
        
                // Update positions of nodes
                nodesGroup.querySelectorAll('.svg-node').forEach(circle => {
                    const value = circle.getAttribute('data-value');
                    const node = findNodeByValue(bst.root, value);
                    if (node) {
                        circle.setAttribute('cx', node.x);
                        circle.setAttribute('cy', node.y);
                    }
                });
        
                // Update positions of texts
                nodesGroup.querySelectorAll('.svg-text').forEach(text => {
                    const value = text.getAttribute('data-value');
                    const node = findNodeByValue(bst.root, value);
                    if (node) {
                        text.setAttribute('x', node.x);
                        text.setAttribute('y', node.y + 5); // Adjust for vertical centering
                    }
                });
            }       
        
            function parseTreeAndHideEdges(node) {
                if (node === null) return true;
        
                const leftHidden = parseTreeAndHideEdges(node.left);
                const rightHidden = parseTreeAndHideEdges(node.right);
        
                if (leftHidden && rightHidden && node.svgElement.classList.contains('node-greyed-out')) {
                    hideSubtreeEdges(node);
                    return true;
                }
                return false;
            }
        
            function hideSubtreeEdges(node) {
                if (node === null) return;
        
                // Hide edges connected to this node
                const edges = document.querySelectorAll(`line[data-parent="${node.value}"], line[data-child="${node.value}"]`);
                edges.forEach(edge => edge.classList.add('hidden-edge'));
        
                // Recursively hide edges for left and right children
                hideSubtreeEdges(node.left);
                hideSubtreeEdges(node.right);
            }
        
            function showAllEdges() {
                const edges = document.querySelectorAll('line');
                edges.forEach(edge => edge.classList.remove('hidden-edge'));
            }
        
        
            function clearTraversalTimeouts() {
                traversalTimeouts.forEach(timeout => clearTimeout(timeout));
                traversalTimeouts = [];
            }
        
            traversalNames.forEach(name => {
                const box = document.createElement('div');
                box.className = 'traversalBox';
            
                const button = document.createElement('button');
                button.textContent = name;
                button.className = 'button-style';
                button.dataset.isStarted = 'false'; // Initialize state as not started
            
                // Event Listener for Traversal Buttons
                button.addEventListener('click', function() {
                    const isStarted = this.dataset.isStarted === 'true';
            
                    if (!isStarted) {
                        // First Click: Start Traversal
                        traverseSortedTree(name, box.querySelector('.traversalList'));
                        this.textContent = 'Cancel'; // Change button text to 'Cancel'
                        this.dataset.isStarted = 'true'; // Update state
            
                        // Disable Other Buttons
                        const buttons = document.querySelectorAll('.button-style');
                        buttons.forEach(btn => {
                            if (btn !== this) btn.disabled = true;
                        });
            
                        // console.log(`Traversal "${name}" started.`);
                    } else {
                        // Second Click: Stop Traversal and Reset
                        clearTraversalTimeouts(); // Stop ongoing traversals
                        redrawTree(); // Redraw the tree visualization
                        this.textContent = name; // Reset button text to original
                        this.dataset.isStarted = 'false'; // Update state
            
                        // Enable All Buttons
                        const buttons = document.querySelectorAll('.button-style');
                        buttons.forEach(btn => btn.disabled = false);
            
                        // console.log(`Traversal "${name}" canceled.`);
                    }
                });
            
                const list = document.createElement('div');
                list.className = 'traversalList';
            
                box.appendChild(button);
                box.appendChild(list);
                container.appendChild(box);
            });
        
        
            document.addEventListener('mousemove', (e) => {
                if (!t_isDragging) return;
        
                const dx = e.clientX - t_startX;
                const dy = e.clientY - t_startY;
        
                let newX = t_initialX + dx;
                let newY = t_initialY + dy;
        
                // Constrain within treeSVG boundaries
                const maxX = treeSVG.clientWidth ;
                const maxY = treeSVG.clientHeight - 250;
        
                newX = Math.max(0, Math.min(newX, maxX));
                newY = Math.max(0, Math.min(newY, maxY));
        
                container.style.left = `${newX}px`;
                container.style.top = `${newY}px`;
            });
        
            document.addEventListener('mouseup', () => {
                t_isDragging = false;
                document.body.style.userSelect = ''; // Re-enable text selection
            });
        
            // Optional: Add touch support for mobile devices
            container.addEventListener('touchstart', (e) => {
                t_isDragging = true;
                t_startX = e.touches[0].clientX;
                t_startY = e.touches[0].clientY;
                t_initialX = container.offsetLeft;
                t_initialY = container.offsetTop;
                document.body.style.userSelect = 'none';
            });
        
            document.addEventListener('touchmove', (e) => {
                if (!t_isDragging) return;
        
                const dx = e.touches[0].clientX - t_startX;
                const dy = e.touches[0].clientY - t_startY;
        
                let newX = t_initialX + dx;
                let newY = t_initialY + dy;
        
                const maxX = treeSVG.clientWidth ;
                const maxY = treeSVG.clientHeight;
        
                newX = Math.max(0, Math.min(newX, maxX));
                newY = Math.max(0, Math.min(newY, maxY));
        
                container.style.left = `${newX}px`;
                container.style.top = `${newY}px`;
            });
        
            document.addEventListener('touchend', () => {
                t_isDragging = false;
                document.body.style.userSelect = '';
            });
        
            // Confirmation popup
            function confirmDeletion(node) {
                // const confirmation = window.confirm(`Do you want to delete node with value ${node.value}?`);
                // if (confirmation) {
                //     visualizeDeletion(node);
                // }
                visualizeDeletion(node);
            }
            
            // Visualize deletion process
            function visualizeDeletion(node) {
                // Disable interactions during deletion
                //disableInteractions();

            
                if (node.left === null && node.right === null) {
                    // Case 1: Leaf Node
                    handleLeafNodeDeletion(node);
                } else if (node.left === null || node.right === null) {
                    // Case 2: One Child
                    handleOneChildDeletion(node);
                } else {
                    // Case 3: Two Children
                    handleTwoChildrenDeletion(node);
                }
              
                // Ensure all highlights are removed after deletion
                setTimeout(() => {
                    removeAllHighlights();
                }, 2000); // Adjust the delay as needed to match your animation duration

                             
            }

             // This function generates a pre-order traversal of the BST and updates the numbers list
             function generatePreOrderTraversal() {
                numbers = [];
                const preOrderTraversal = (node) => {
                    if (node !== null) {
                        numbers.push(node.value);
                        preOrderTraversal(node.left);
                        preOrderTraversal(node.right);
                    }
                };
                preOrderTraversal(bst.root);
                // console.log("numbersList after pre-order traversal: ", numbers);
                updateNumbersList();
                textarea.value = numbers.join(', ');
            }
        
            // Corrected handleLeafNodeDeletion Function
            function handleLeafNodeDeletion(bstNode) {
                showStatus(`Deleting leaf node: ${bstNode.value}`);

                // Highlight node
                bstNode.svgElement.classList.add('highlighted');

                // Remove connected edges with animation
                removeEdgesConnectedToNodeWithAnimation(bstNode, () => {
                    // After edges are removed, fade out the node
                    bstNode.svgElement.classList.add('fade-out');
                    bstNode.textElement.classList.add('fade-out');

                    // Listen for the end of the fade-out animation to remove the node
                    bstNode.svgElement.addEventListener('transitionend', function handleFadeEnd() {
                        // Remove highlights before removing the node
                        bstNode.svgElement.classList.remove('highlighted');

                        // Remove node from BST data structure
                        bst.delete(bstNode.value);

                        // Remove node's SVG elements from the DOM
                        bstNode.svgElement.remove();
                        bstNode.textElement.remove();

                        // Update UI elements
                        numbers = numbers.filter(num => String(num) !== String(bstNode.value));
                        updateNumbersList();
                        textarea.value = numbers.join(', ');

                        // Recalculate positions and update visualization
                        simulateInsertions();
                        updateNodePositions();

                        generatePreOrderTraversal();


                        // Provide user feedback
                        showStatus(`Leaf node ${bstNode.value} deleted.`);

                        // Remove the event listener to prevent memory leaks
                        bstNode.svgElement.removeEventListener('transitionend', handleFadeEnd);
                    });
                });
            }
        
            function handleOneChildDeletion(node) {
                // **Step 1: Highlight the node to be deleted and its child (2 seconds)**
                showStatus(`Deleting node with one child: ${node.value}`);

                // Determine the child node
                const childNode = node.left || node.right;

                // Highlight both nodes
                node.svgElement.classList.add('highlighted');
                childNode.svgElement.classList.add('highlighted');

                // Wait for 2 seconds before proceeding to Step 2
                setTimeout(() => {
                    // **Step 2: Fade out all edges connected to the node and its child (1 second)**

                    // Function to fade out edges with animation
                    const fadeOutEdges = (targetNode, callback) => {
                        removeEdgesConnectedToNodeWithAnimation(targetNode, callback);
                    };

                    // Initiate fading out edges for both nodes simultaneously
                    let edgesFaded = 0;
                    const totalEdgesToFade = 2; // Node and its child

                    const checkAllEdgesFaded = () => {
                        edgesFaded += 1;
                        if (edgesFaded === totalEdgesToFade) {
                            // All edges have faded out, proceed to Step 3 after 1 second
                            setTimeout(() => {
                                proceedToStep3();
                            }, 300);
                        }
                    };

                    fadeOutEdges(node, checkAllEdgesFaded);
                    fadeOutEdges(childNode, checkAllEdgesFaded);

                }, 1000); // 2-second delay for Step 1

                // **Step 3: Fade out the node to be deleted and update visualization (1 second)**
                function proceedToStep3() {
                    // Fade out the node to be deleted
                    node.svgElement.classList.add('fade-out');
                    node.textElement.classList.add('fade-out');

                    // Listen for the end of the fade-out animation
                    const handleFadeEnd = () => {
                        // Remove event listener to prevent multiple triggers
                        node.svgElement.removeEventListener('transitionend', handleFadeEnd);

                        // **Remove node from BST data structure**
                        bst.delete(node.value);

                        // **Remove node's SVG elements**
                        node.svgElement.remove();
                        node.textElement.remove();

                        // **Recreate edges for the child node**
                        if (childNode.parent) {
                            createEdgeWithAnimation(childNode.parent, childNode);
                        }

                        if (childNode.left !== null) {
                            createEdgeWithAnimation(childNode, childNode.left);
                        }
                        if (childNode.right !== null) {
                            createEdgeWithAnimation(childNode, childNode.right);
                        }

                        // **Update UI elements after a short delay to ensure animations are complete**
                        setTimeout(() => {
                            numbers = numbers.filter(num => String(num) !== String(node.value));
                            updateNumbersList();
                            textarea.value = numbers.join(', ');

                            // Recalculate positions and update the visualization
                            simulateInsertions();
                            updateNodePositions();
                            generatePreOrderTraversal();

                            // **Provide user feedback**
                            showStatus(`Node ${node.value} deleted.`);

                            // **Cleanup: Remove highlights from the child node**
                            childNode.svgElement.classList.remove('highlighted');

                        }, 500); // Short delay to ensure smooth transition
                    };

                    // Add event listener for the fade-out transition end
                    node.svgElement.addEventListener('transitionend', handleFadeEnd);
                }
            }
            
            function handleTwoChildrenDeletion(node) {
                // **Step 1: Highlight the node to be deleted and its in-order successor (2 seconds)**
                const successor = bst.minValueNode(node.right);
                showStatus(`Deleting node ${node.value}\nIn-order successor is ${successor.value}`);
            
                // Highlight both nodes
                node.svgElement.classList.add('highlighted');
                successor.svgElement.classList.add('highlighted');
            
                // Wait for 2 seconds before proceeding to Step 2
                setTimeout(() => {
                    // **Step 2: Fade out all edges connected to the node and its successor (1 second)**
            
                    // Function to fade out edges with animation
                    const fadeOutEdges = (targetNode, callback) => {
                        removeEdgesConnectedToNodeWithAnimation(targetNode, callback);
                    };
            
                    // Initiate fading out edges for both nodes simultaneously
                    let edgesFaded = 0;
                    const totalEdgesToFade = 2; // Node and successor
            
                    const checkAllEdgesFaded = () => {
                        edgesFaded += 1;
                        if (edgesFaded === totalEdgesToFade) {
                            // All edges have faded out, proceed to Step 3 after 1 second
                            setTimeout(() => {
                                proceedToStep3();
                            }, 1000);
                        }
                    };
            
                    fadeOutEdges(node, checkAllEdgesFaded);
                    fadeOutEdges(successor, checkAllEdgesFaded);
            
                }, 2000); // 2-second delay for Step 1
            
                // **Step 3: Fade out the successor node and update node values (1 second)**
                function proceedToStep3() {
                    // Fade out the successor node
                    successor.svgElement.classList.add('fade-out');
                    successor.textElement.classList.add('fade-out');
            
                    // Listen for the end of the fade-out animation
                    const handleFadeEnd = () => {
                        // Remove event listener to prevent multiple triggers
                        successor.svgElement.removeEventListener('transitionend', handleFadeEnd);
            
                        // **Update the node's value with the successor's value**
                        const originalValue = node.value;
                        node.value = successor.value;
                        node.textElement.textContent = node.value;
                        node.svgElement.setAttribute('data-value', node.value);
                        node.textElement.setAttribute('data-value', node.value);
            
                        // **Remove the successor node from the BST and visualization**
                        bst.delete(successor.value);
                        successor.svgElement.remove();
                        successor.textElement.remove();
            
                        // **Recreate edges for the updated node**
                        const parentNode = node.parent;
                        if (parentNode) {
                            createEdgeWithAnimation(parentNode, node);
                        }
            
                        if (node.left !== null) {
                            createEdgeWithAnimation(node, node.left);
                        }
                        if (node.right !== null) {
                            createEdgeWithAnimation(node, node.right);
                        }
            
                        if (node.right !== null && node.right.left !== null) {
                            createEdgeWithAnimation(node.right, node.right.left);
                        }
            
                        // Update any edges connected to the updated node
                        updateEdgesConnectedToNode(node);
            
                        // **Update UI elements after a short delay to ensure animations are complete**
                        setTimeout(() => {
                            numbers = numbers.filter(num => String(num) !== String(originalValue));
                            updateNumbersList();
                            textarea.value = numbers.join(', ');
            
                            // Recalculate positions and update the visualization
                            simulateInsertions();
                            updateNodePositions();
                            generatePreOrderTraversal();
            
                            // **Provide user feedback**
                            showStatus(`Node ${originalValue} deleted \nand replaced with ${successor.value}.`);
            
                            // Remove highlight from the updated node
                            node.svgElement.classList.remove('highlighted');
                        }, 500); // Short delay to ensure smooth transition
            
                    };
            
                    // Add event listener for the fade-out transition end
                    successor.svgElement.addEventListener('transitionend', handleFadeEnd);
                }
            }
        
            /**
             * Replaces the value of the node to be deleted with the target node's value,
             * updates the visualization, and removes the target node's SVG elements.
             * @param {Node} node - The node to be deleted (with two children).
             * @param {Node} targetNode - The in-order successor node.
             */
            function replaceNodeValue(node, targetNode) {
                // Store the node's original value
                const originalValue = node.value;
            
                // Replace node's value with target node's value in the data structure and visualization
                node.value = targetNode.value;
                node.textElement.textContent = node.value;
                node.svgElement.setAttribute('data-value', node.value);
                node.textElement.setAttribute('data-value', node.value);
            
                // Remove the node's original value from the numbers list
                numbers = numbers.filter(num => String(num) !== String(originalValue));
            
                // Remove the target node's SVG elements and delete it from the BST
                removeEdgesConnectedToNodeWithAnimation(targetNode, () => {
                    // Fade out the Target Node
                    targetNode.svgElement.classList.add('fade-out');
                    targetNode.textElement.classList.add('fade-out');
            
                    // Listen for the end of the fade-out animation to remove the node
                    targetNode.svgElement.addEventListener('transitionend', function handleFadeEnd() {
                        // Remove node from BST data structure
                        bst.delete(targetNode.value);
            
                        // Remove node's SVG elements
                        targetNode.svgElement.remove();
                        targetNode.textElement.remove();
            
                        // Update UI elements
                        updateNumbersList();
                        textarea.value = numbers.join(', ');
            
                        // Recalculate positions and update visualization
                        simulateInsertions();
                        updateNodePositions();
            
                        // Provide user feedback
                        showStatus(`Node ${originalValue} deleted and replaced with ${targetNode.value}.`);
            
                        // Remove the event listener
                        targetNode.svgElement.removeEventListener('transitionend', handleFadeEnd);
                    });
                });
            }
            
            
        
            // === Traversal and Visualization Functions Continued ===
        
            // Function to dynamically resize the SVG based on tree size
            function resizeSVG() {
                // Check if the tree is empty
                if (bst.root === null) return; // No need to resize if the tree is empty
            
                let minX = Infinity;
                let maxX = -Infinity;
                let minY = Infinity;
                let maxY = -Infinity;
            
                // Traverse the tree and find the min/max x and y positions of the nodes
                function traverseTree(node) {
                    if (node === null) return;
            
                    // Find the minimum and maximum x and y values
                    if (node.x < minX) minX = node.x;
                    if (node.x > maxX) maxX = node.x;
                    if (node.y < minY) minY = node.y;
                    if (node.y > maxY) maxY = node.y;
            
                    traverseTree(node.left);
                    traverseTree(node.right);
                }
            
                traverseTree(bst.root);
            
                // Check if minX and maxX have been updated
                if (minX === Infinity || maxX === -Infinity || minY === Infinity || maxY === -Infinity) {
                    return; // No valid nodes to calculate viewBox
                }
            
                // Add padding to the tree to prevent nodes from being cropped
                const padding = 0;
                minX -= padding;
                maxX += padding;
                minY -= padding;
                maxY += padding;
            
                // Ensure minimum values are at least zero
                minX = Math.max(0, minX);
                minY = Math.max(0, minY);
            
                // Update only the SVG's `viewBox` without affecting other elements like the topPane
                treeSVG.setAttribute('viewBox', `${minX} ${minY} ${maxX - minX} ${maxY - minY}`);
            }
        
            function simulateInsertions() {
                expectedPositions = {}; // Reset expected positions
                const dataType = document.getElementById('dataTypeSelect').value;
                const simulationTree = new BST(dataType);
            
                // Insert all values into the simulation tree
                numbers.forEach(value => {
                    simulationTree.insert(value);
                });
            
                // Compute the maximum depth of the tree
                const maxDepth = simulationTree.getMaxDepth();
            
                // Assign positions to nodes in the simulation tree
                simulationTree.assignPosition(simulationTree.root, 50, treeLayer.clientWidth - 50, 1, maxDepth);
            
                // Traverse the simulation tree and store positions
                function storePositions(node) {
                    if (node === null) return;
                    expectedPositions[String(node.value)] = { x: node.x, y: node.y };
                    storePositions(node.left);
                    storePositions(node.right);
                }
            
                storePositions(simulationTree.root);
            }
            
            // === Redraw and Update Functions ===
            function updateTree() {
                if (bst.root !== null) {
                    // Compute the maximum depth of the tree
                    const maxDepth = bst.getMaxDepth();
            
                    // Recalculate positions using the correct parameters
                    bst.assignPosition(bst.root, 50, treeLayer.clientWidth - 50, 1, maxDepth);
            
                    // Update positions of SVG elements
                    updateSVGElements();
                }
            }
            
            // Function to redraw the tree
            function redrawTree() {
                // console.log("Redrawing tree...");
            
                // Clear existing SVG elements
                edgesGroup.innerHTML = '';
                nodesGroup.innerHTML = '';
            
                // Reset the BST
                const dataType = document.getElementById('dataTypeSelect').value;
                bst = new BST(dataType);
            
                // Insert nodes into the BST
                insertNodesintoBST();
            
            }

             // Insert nodes into the BST
            function insertNodesintoBST() {
                numbers.forEach(value => {
                    const newNode = bst.insert(value);
                    // console.log(`Inserting node with value: ${value}`); // Debugging
            
                    if (newNode) {
                        const pos = expectedPositions[String(newNode.value)];
                        if (pos) {
                            newNode.x = pos.x;
                            newNode.y = pos.y;
                            // console.log(`Position for ${newNode.value}: x=${newNode.x}, y=${newNode.y}`); // Debugging
                        } else {
                            console.error(`No position found for ${newNode.value}`); // Debugging
                        }
            
                        createNodeElement(newNode); // Create SVG elements for the node
            
                        if (newNode.parent) {
                            createEdge(newNode.parent, newNode);
                        }
                    } else {
                        console.error(`Failed to insert node with value: ${value}`); // Debugging
                    }
                });

            }

        
            // Call resizeSVG and redrawTree after any layout change
            function updateLayout() {
                // console.log("Updating layout...");
                //resizeSVG();
                redrawTree();
            }
            
        
            traversalsPaneHandle.addEventListener('click', function() {
        
                if (container.style.display === 'none' || container.style.display === '') {
                    container.style.display = 'flex'; // Show the container
                } else {
                    container.style.display = 'none'; // Hide the container
                }
        
                // Redraw the tree
                //updateLayout();
                //updateTree();
                //insertNodesintoBST();
        
                // Stop any ongoing traversals
               //  clearTraversalTimeouts();
        
                // Clear all traversal lists
               // const traversalLists = document.querySelectorAll('.traversalList');
               // traversalLists.forEach(list => list.innerHTML = '');
            });

            function highlightNodeGrey(node) {
                node.svgElement.classList.add('highlighted');
                setTimeout(() => node.svgElement.classList.remove('highlighted'), 500);
            }
        
            function resetNodeColors() {
                const nodes = document.querySelectorAll('.svg-node');
                nodes.forEach(node => node.classList.remove('node-greyed-out'));
            }
        
            let traversalTimeouts = [];
        
            function traverseSortedTree(type, listElement) {
                listElement.innerHTML = '';
                clearTraversalTimeouts();
        
                // Reset node colors and show all edges
                resetNodeColors();
                showAllEdges();
        
                // Disable other traversal buttons
                const buttons = document.querySelectorAll('.button-style');
                buttons.forEach(button => {
                    if (button.textContent !== type) {
                        button.disabled = true;
                    }
                });
        
                const nodes = [];
                if (type === "In-Order") {
                    inOrderTraversal(bst.root, nodes);
                    displayTraversal('In-Order');
                } else if (type === "Post-Order") {
                    postOrderTraversal(bst.root, nodes);
                    displayTraversal('Post-Order');
                } else if (type === "Pre-Order") {
                    preOrderTraversal(bst.root, nodes);
                    displayTraversal('Pre-Order');
                }
        
                nodes.forEach((node, index) => {
                    const timeout = setTimeout(() => {
                        highlightNodeGrey(node);
                        const listItem = document.createElement('div');
                        listItem.textContent = node.value;
                        listItem.className = 'traversal-number-item';
                        listItem.setAttribute('data-value', node.value); // Ensure data-value is set

                        listElement.appendChild(listItem);
        
                        // Mark node as grayed out
                        node.svgElement.classList.add('node-greyed-out');
        
        
                        // Parse tree to hide edges if necessary
                        parseTreeAndHideEdges(bst.root);

                        setTimeout(() => {
                                // Enable all buttons after traversal is complete
                                if (index === nodes.length - 1) {
                                    buttons.forEach(button => button.disabled = false);

                                    // Call redrawTree() after traversal is complete
                                    redrawTree();

                                    // Add event listeners to traversal items after list is generated
                                    addTraversalItemListeners();

                                    //define current button
                                    const currentButton = document.querySelector('.button-style');
                                
                                    if (currentButton) {
                                        currentButton.textContent = type;
                                        // console.log("Button text changed back to: ", type);
                                    }  
                                }
                        }, 1500);
                    }, index * 1000); // Delay for each node

                    traversalTimeouts.push(timeout);
                });
            }
        
            function inOrderTraversal(node, nodes, delay = 1000) {
                if (node === null) return;
        
                inOrderTraversal(node.left, nodes, delay);
                nodes.push(node);
                inOrderTraversal(node.right, nodes, delay);
            }
        
            function displayTraversal(text) { 
                if (text === 'In-Order') {      
                    comparisonBox.textContent = `In-Order:\nLeft -> Root -> Right`;
                } else if (text === 'Post-Order') {
                    comparisonBox.textContent = `Post-Order:\nLeft -> Right -> Root`;
                } else if (text === 'Pre-Order') {
                    comparisonBox.textContent = `Pre-Order:\nRoot -> Left -> Right`;
                }
            }
        
            function preOrderTraversal(node, nodes) {
                if (node === null) return;
                nodes.push(node);
                preOrderTraversal(node.left, nodes);
                preOrderTraversal(node.right, nodes);
            }
        
            function postOrderTraversal(node, nodes) {
                if (node === null) return;
                postOrderTraversal(node.left, nodes);
                postOrderTraversal(node.right, nodes);
                nodes.push(node);
            }
        
            function highlightSubtree(node) {
                if (node === null) return;
                node.svgElement.classList.add('subtree-highlight');
                highlightSubtree(node.left);
                highlightSubtree(node.right);
            }
        
            function unhighlightSubtree(node) {
                if (node === null) return;
                node.svgElement.classList.remove('subtree-highlight');
                unhighlightSubtree(node.left);
                unhighlightSubtree(node.right);
            }
        
            function copyTraversalList(listElement) {
                const values = Array.from(listElement.children).map(item => item.textContent);
                const csv = values.join(', ');
                navigator.clipboard.writeText(csv).then(() => {
                    alert('Traversal list copied to clipboard!');
                }).catch(err => {
                    console.error('Failed to copy text: ', err);
                });
            }
                
            createButton.addEventListener('click', function() {
                // Stop any ongoing traversals
                clearTraversalTimeouts();
        
                // Clear all traversal lists
                const traversalLists = document.querySelectorAll('.traversalList');
                traversalLists.forEach(list => list.innerHTML = '');
            });
                
            randomizeButtonReset.addEventListener('click', function() {
                // Stop any ongoing traversals
                clearTraversalTimeouts();
        
                // Clear all traversal lists
                const traversalLists = document.querySelectorAll('.traversalList');
                traversalLists.forEach(list => list.innerHTML = '');
            });
        
          

            function removeAllHighlights() {
                const allNodes = document.querySelectorAll('.svg-node');
                allNodes.forEach(domNode => {
                    domNode.classList.remove('highlighted', 'selected', 'child-highlight', 'successor-highlight');
                });
            }
        
            /**
             * Recalculates and updates all node positions and edges after deletions or insertions.
             */
            function updateNodePositions() {
                if (bst.root !== null) {
                    // Assign new positions based on expectedPositions
                    bst.assignPosition(bst.root, 50, treeLayer.clientWidth - 50, 1, bst.getMaxDepth());
        
                    // Update positions of nodes
                    nodesGroup.querySelectorAll('.svg-node').forEach(circle => {
                        const value = circle.getAttribute('data-value');
                        const node = findNodeByValue(bst.root, value);
                        if (node) {
                            circle.setAttribute('cx', node.x);
                            circle.setAttribute('cy', node.y);
                        }
                    });
        
                    // Update positions of texts
                    nodesGroup.querySelectorAll('.svg-text').forEach(text => {
                        const value = text.getAttribute('data-value');
                        const node = findNodeByValue(bst.root, value);
                        if (node) {
                            text.setAttribute('x', node.x);
                            text.setAttribute('y', node.y); // Adjust for vertical centering
                        }
                    });
        
                    // Update edges
                    updateEdges();                    
                }
            }
        
            /**
             * Updates all edges based on the current positions of nodes.
             */
            function updateEdges() {
                edgesGroup.querySelectorAll('.svg-edge').forEach(line => {
                    const parentValue = line.getAttribute('data-parent');
                    const childValue = line.getAttribute('data-child');
                    const parentNode = findNodeByValue(bst.root, parentValue);
                    const childNode = findNodeByValue(bst.root, childValue);
        
                    if (parentNode && childNode) {
                        line.setAttribute('x1', parentNode.x);
                        line.setAttribute('y1', parentNode.y);
                        line.setAttribute('x2', childNode.x);
                        line.setAttribute('y2', childNode.y);
                    } else {
                        // If either node is missing, remove the edge
                        line.remove();
                    }
                });
            }
        
            /**
             * Finds a node in the BST by its value.
             * @param {Node} node - The current node in the traversal.
             * @param {string|number} value - The value to search for.
             * @returns {Node|null} - The node with the matching value or null if not found.
             */
            function findNodeByValue(node, value) {
                if (node === null) return null;
                if (String(node.value) === String(value)) return node;
                let found = findNodeByValue(node.left, value);
                if (found) return found;
                return findNodeByValue(node.right, value);
            }
        
            /**
             * Removes all edges connected to a specific node.
             * @param {Node} node - The node whose connected edges should be removed.
             */
            function removeEdgesConnectedToNode(node) {
                // Remove edges where the node is the parent
                const parentEdges = document.querySelectorAll(`line[data-parent="${node.value}"]`);
                parentEdges.forEach(edge => edge.remove());
        
                // Remove edges where the node is the child
                const childEdges = document.querySelectorAll(`line[data-child="${node.value}"]`);
                childEdges.forEach(edge => edge.remove());
            }
        
            /**
             * Removes edges connected to a node with a fade-out animation.
             * @param {Node} node - The node whose edges should be removed.
             * @param {Function} callback - The function to call after all edges are removed.
             */
            function removeEdgesConnectedToNodeWithAnimation(node, callback) {
                const edges = document.querySelectorAll(`line[data-parent="${node.value}"], line[data-child="${node.value}"]`);
                let edgesToRemove = edges.length;
                if (edgesToRemove === 0) {
                    if (callback) callback();
                    return;
                }
        
                edges.forEach(edge => {
                    // Add fade-out class
                    edge.classList.add('fade-out');
        
                    // Listen for transition end
                    edge.addEventListener('transitionend', function handleTransitionEnd() {
                        edge.remove();
                        edgesToRemove--;
                        edge.removeEventListener('transitionend', handleTransitionEnd);
                        if (edgesToRemove === 0 && callback) callback();
                    });
                });
            }
        
            /**
             * Creates a new edge with a draw animation between two nodes.
             * @param {Node} parentNode - The parent node.
             * @param {Node} childNode - The child node.
             * @param {Function} callback - The function to call after the edge is drawn.
             */
            function createEdgeWithAnimation(parentNode, childNode, callback) {
                const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                line.setAttribute('x1', parentNode.x);
                line.setAttribute('y1', parentNode.y);
                line.setAttribute('x2', parentNode.x); // Start at parent node position
                line.setAttribute('y2', parentNode.y); // Start at parent node position
                line.setAttribute('stroke', 'black');
                line.setAttribute('stroke-width', '2');
                line.classList.add('svg-edge', 'draw-edge'); // 'draw-edge' for animation
                line.setAttribute('data-parent', parentNode.value);
                line.setAttribute('data-child', childNode.value);
                edgesGroup.appendChild(line);
            
                // Trigger the drawing animation by updating the x2 and y2 to child node's position
                requestAnimationFrame(() => {
                    line.classList.remove('draw-edge');
                    line.setAttribute('x2', childNode.x);
                    line.setAttribute('y2', childNode.y);
                });
            
                // Listen for the end of the animation if a callback is provided
                if (callback) {
                    line.addEventListener('transitionend', function handleDrawEnd() {
                        line.removeEventListener('transitionend', handleDrawEnd);
                        callback();
                    });
                }
            }
            
        
            /**
             * Moves a node smoothly from its current position to a target position.
             * @param {Node} node - The node to move.
             * @param {number} targetX - The target X-coordinate.
             * @param {number} targetY - The target Y-coordinate.
             * @param {Function} callback - The function to call after movement is complete.
             */
            function moveNodeWithAnimation(node, targetX, targetY, callback) {
                const duration = 500; // Animation duration in milliseconds
                const startX = parseFloat(node.svgElement.getAttribute('cx'));
                const startY = parseFloat(node.svgElement.getAttribute('cy'));
                const deltaX = targetX - startX;
                const deltaY = targetY - startY;
                const startTime = performance.now();
            
                function animate(time) {
                    const elapsed = time - startTime;
                    const progress = Math.min(elapsed / duration, 1);
            
                    const currentX = startX + deltaX * progress;
                    const currentY = startY + deltaY * progress;
            
                    node.svgElement.setAttribute('cx', currentX);
                    node.svgElement.setAttribute('cy', currentY);
                    node.textElement.setAttribute('x', currentX);
                    node.textElement.setAttribute('y', currentY + 5); // Adjust for vertical centering
            
                    node.x = currentX;
                    node.y = currentY;
            
                    // Update connected edges
                    updateEdgesConnectedToNode(node);
            
                    if (progress < 1) {
                        requestAnimationFrame(animate);
                    } else {
                        if (callback) callback();
                    }
                }
            
                requestAnimationFrame(animate);
            }
        
            /**
             * Updates all edges connected to a specific node based on its new position.
             * @param {Node} node - The node whose connected edges should be updated.
             */
            function updateEdgesConnectedToNode(node) {
                // Update edges where this node is the parent
                edgesGroup.querySelectorAll(`line[data-parent="${node.value}"]`).forEach(edge => {
                    const childValue = edge.getAttribute('data-child');
                    const childNode = findNodeByValue(bst.root, childValue);
                    if (childNode) {
                        edge.setAttribute('x1', node.x);
                        edge.setAttribute('y1', node.y);
                        edge.setAttribute('x2', childNode.x);
                        edge.setAttribute('y2', childNode.y);
                    }
                });
        
                // Update edges where this node is the child
                edgesGroup.querySelectorAll(`line[data-child="${node.value}"]`).forEach(edge => {
                    const parentValue = edge.getAttribute('data-parent');
                    const parentNode = findNodeByValue(bst.root, parentValue);
                    if (parentNode) {
                        edge.setAttribute('x1', parentNode.x);
                        edge.setAttribute('y1', parentNode.y);
                        edge.setAttribute('x2', node.x);
                        edge.setAttribute('y2', node.y);
                    }
                });
            }
        
            /**
             * Finalizes the deletion process by updating the BST and visualization.
             * @param {string|number} deletedValue - The value of the deleted node.
             */
            function finalizeDeletion(deletedValue) {
                // Remove the deleted node's SVG elements if they still exist
                const deletedNode = findNodeByValue(bst.root, deletedValue);
                if (deletedNode) {
                    deletedNode.svgElement.remove();
                    deletedNode.textElement.remove();
                }
        
                // Remove from numbers list with animation
                const numItems = document.querySelectorAll(`.number-item[data-value="${deletedValue}"]`);
                numItems.forEach(item => {
                    item.classList.add('fade-out');
                    item.addEventListener('transitionend', () => {
                        item.remove();
                    });
                });
        
                // Remove the value from the numbers array
                numbers = numbers.filter(num => String(num) !== String(deletedValue));
        
                // Re-render the numbers list without the deleted item
                updateNumbersList();
        
                // Update the textarea to reflect the updated numbers array
                textarea.value = numbers.join(', ');
        
                // Recalculate positions
                simulateInsertions();
        
                // Update positions of nodes
                updateNodePositions();
        
                // Enable interactions
                enableInteractions();
        
                showStatus(`Node ${deletedValue} deleted.`);
            }
        
            /**
             * Enables interactions with SVG nodes.
             */
            function enableInteractions() {
                document.querySelectorAll('.svg-node').forEach(nodeElement => {
                    nodeElement.style.pointerEvents = 'auto';
                });
            }
        
            /**
             * Disables interactions with SVG nodes.
             */
            function disableInteractions() {
                document.querySelectorAll('.svg-node').forEach(nodeElement => {
                    nodeElement.style.pointerEvents = 'none';
                });
            }
        
            /**
             * Updates the visualization after deletions or insertions.
             */
            function updateAfterDeletion() {
                // Remove highlights
                document.querySelectorAll('.highlighted, .child-highlight, .successor-highlight').forEach(el => {
                    el.classList.remove('highlighted', 'child-highlight', 'successor-highlight');
                });
            
                // Recalculate positions and redraw the tree
                simulateInsertions(); // Recalculate expected positions
                updateTree(); // Update SVG elements with new positions
            
                // Update numbers list
                updateNumbersList();
            
                showStatus(`Node ${deletedNodeValue} deleted.`);
            }
        
            /**
             * Generates a random short word (less than 5 characters).
             * @returns {string} - A random word.
             */
            function generateRandomWord() {
                const words = ['ace', 'ant', 'bat', 'bag', 'bed', 'can', 'cat', 'cow', 'dog', 'ear', 'egg', 'eat', 'fox', 'fun', 'hat', 'jam', 'kid', 'leg', 'man', 'net', 'owl', 'pig', 'rat', 'toy', 'zip'];
                const randomIndex = Math.floor(Math.random() * words.length);
                return words[randomIndex];
            } 

            function showStatus(message) {
                comparisonBox.innerText = message;
                comparisonBox.classList.add('show');
            }
            
            function highlightNode(node, className) {
                if (node.svgElement) {
                    node.svgElement.classList.add(className);
                }
                if (node.textElement) {
                    if (className === 'highlighted') {
                        node.textElement.style.fill = 'var(--color-node-text-highlighted)'; // Black text for highlighted nodes
                    } else {
                        node.textElement.style.fill = 'var(--color-node-text)'; // White text otherwise
                    }
                }
            }
        
            // Assuming numbersList is the parent container for .number-item elements
            numbersList.addEventListener('mouseover', function(event) {
                if (event.target.classList.contains('number-item')) {
                    const value = event.target.getAttribute('data-value');
                    const node = findNodeByValue(bst.root, value);
                    //add style node-focus to node
                    node.svgElement.classList.add('node-focus');
            
                    if (node) {
                        highlightNode(node, 'highlighted'); // Highlight the corresponding node
                    }
                    // Highlight all traversal items with the same value across all lists
                    const matchingItems = document.querySelectorAll(`.traversal-number-item[data-value="${node.value}"]`);
                    matchingItems.forEach(matchingItem => {
                        matchingItem.classList.add('highlight');
                    });
                    // Highlight the corresponding number-item
                    const numItem = document.querySelector(`.number-item[data-value="${node.value}"]`);
                    if (numItem) {
                        numItem.classList.add('highlight');
                    }
                    
                }
            });
            
            numbersList.addEventListener('mouseout', function(event) {
                if (event.target.classList.contains('number-item')) {
                    const value = event.target.getAttribute('data-value');
                    const node = findNodeByValue(bst.root, value);
                    node.svgElement.classList.remove('node-focus');
                    if (node) {
                        unhighlightNode(node, 'highlighted'); // Unhighlight the corresponding node
                    }
                    
                     // Highlight all traversal items with the same value across all lists
                     const matchingItems = document.querySelectorAll(`.traversal-number-item[data-value="${node.value}"]`);
                     matchingItems.forEach(matchingItem => {
                         matchingItem.classList.remove('highlight');
                     });
                     // Highlight the corresponding number-item
                     const numItem = document.querySelector(`.number-item[data-value="${node.value}"]`);
                     if (numItem) {
                         numItem.classList.remove('highlight');
                     }


                }
            });

            function addTraversalItemListeners() {
                const traversalItems = document.querySelectorAll('.traversal-number-item');
                
                traversalItems.forEach(item => {
                    item.addEventListener('mouseenter', () => {
                        const value = item.getAttribute('data-value');
                        // console.log(`Hovered over traversal item: ${value}`);
                        
                        // Highlight all traversal items with the same value
                        const matchingItems = document.querySelectorAll(`.traversal-number-item[data-value="${value}"]`);
                        matchingItems.forEach(matchingItem => {
                            matchingItem.classList.add('highlight');
                        });
            
                        // Highlight the corresponding number-item
                        const numItem = document.querySelector(`.number-item[data-value="${value}"]`);
                        if (numItem) {
                            numItem.classList.add('highlight');
                        }
                        
                        // Highlight the corresponding node
                        const node = findNodeByValue(bst.root, value);
                        if (node && node.svgElement) {
                            node.svgElement.classList.add('node-focus');
                        }
                    });
            
                    item.addEventListener('mouseleave', () => {
                        const value = item.getAttribute('data-value');
                        
                        // Remove highlight from all traversal items with the same value
                        const matchingItems = document.querySelectorAll(`.traversal-number-item[data-value="${value}"]`);
                        matchingItems.forEach(matchingItem => {
                            matchingItem.classList.remove('highlight');
                        });
            
                        // Remove highlight from the corresponding number-item
                        const numItem = document.querySelector(`.number-item[data-value="${value}"]`);
                        if (numItem) {
                            numItem.classList.remove('highlight');
                        }
                        
                        // Remove focus from the corresponding node
                        const node = findNodeByValue(bst.root, value);
                        if (node && node.svgElement) {
                            node.svgElement.classList.remove('node-focus');
                        }
                    });
                });
            }
            
            

            function setupNodeEventListeners(node) {

                node.svgElement.addEventListener('mouseenter', () => {
                    
                    // Find number-item(s) with matching data-value
                    const numItems = document.querySelectorAll(`.number-item[data-value="${node.value}"]`);
                    node.svgElement.classList.add('node-focus');
                    
                    numItems.forEach(item => {
                        item.classList.add('highlight');
                    });

                    // Highlight all traversal items with the same value across all lists
                    const matchingItems = document.querySelectorAll(`.traversal-number-item[data-value="${node.value}"]`);
                    matchingItems.forEach(matchingItem => {
                        matchingItem.classList.add('highlight');
                    });
                    // Highlight the corresponding number-item
                    const numItem = document.querySelector(`.number-item[data-value="${node.value}"]`);
                    if (numItem) {
                        numItem.classList.add('highlight');
                    }
                   

                   
                });
            
                node.svgElement.addEventListener('mouseleave', () => {
                    node.svgElement.classList.remove('node-focus');
                    const numItems = document.querySelectorAll(`.number-item[data-value="${node.value}"]`);
                    numItems.forEach(item => {
                        item.classList.remove('highlight');
                    });
                    // Highlight all traversal items with the same value across all lists
                    const matchingItems = document.querySelectorAll(`.traversal-number-item[data-value="${node.value}"]`);
                    matchingItems.forEach(matchingItem => {
                        matchingItem.classList.remove('highlight');
                    });
                    // Highlight the corre s sponding number-item
                    const numItem = document.querySelector(`.number-item[data-value="${node.value}"]`);
                    if (numItem) {
                        numItem.classList.remove('highlight');
                    }

                                     
                });
            }
            
            function unhighlightNode(node, className) {
                if (node.svgElement) {
                    node.svgElement.classList.remove(className);
                }
                if (node.textElement) {
                    node.textElement.style.fill = '#ffffff'; // Reset text color to white
                }
            }  

            // JavaScript to update the scale factor based on window width
            // function updateScaleFactor() {
            //     const scaleFactor = 1;
            //     document.documentElement.style.setProperty('--scale-factor', scaleFactor);
            //     console.log(`Scale factor updated to: ${scaleFactor}`);
            // }
            
             //update when window resizes
            window.addEventListener('resize', () => {
                initialNodeRadius = window.innerWidth / 40;
                //rsize the svg-node text appropriately for window size changes 
                //2560x1600

                //updateScaleFactor(); 

                // Initialize the demo (if needed)
                initializeDemo();
                
                // Update the tree with new positions
                updateTree();
                
                // Redraw the tree to reflect changes
                redrawTree();
                //redraw the svg
            });

           
            const fullscreenButton = document.getElementById('fullscreenButton');

            fullscreenButton.addEventListener('click', () => {
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(err => {
                        alert(`Error attempting to enable fullscreen mode: ${err.message} (${err.name})`);
                    });
                } else {
                    document.exitFullscreen();
                }
            });
         
        

});
                
