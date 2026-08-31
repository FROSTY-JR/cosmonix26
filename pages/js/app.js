//step 1: get DOM
let nextDom = document.getElementById('next');
let prevDom = document.getElementById('prev');

let carouselDom = document.querySelector('.carousel');
let SliderDom = carouselDom.querySelector('.carousel .list');
let thumbnailBorderDom = document.querySelector('.carousel .thumbnail');
let thumbnailItemsDom = thumbnailBorderDom.querySelectorAll('.item');
let timeDom = document.querySelector('.carousel .time');

let sliderItemsDom = SliderDom.querySelectorAll('.item');
sliderItemsDom.forEach((item, index) => item.dataset.cardId = index);
thumbnailItemsDom.forEach((item, index) => item.dataset.cardId = index);
let timeRunning = 650;
let timeAutoNext = 8000;

function updateSelectedCard(){
    let activeCardId = SliderDom.querySelector('.item').dataset.cardId;

    thumbnailBorderDom.querySelectorAll('.item').forEach(item => {
        item.classList.toggle('selected', item.dataset.cardId === activeCardId);
    });
}

nextDom.onclick = function(){
    showSlider('next');    
}

prevDom.onclick = function(){
    showSlider('prev');    
}

thumbnailBorderDom.addEventListener('click', function(event){
    let thumbnail = event.target.closest('.item');

    if(!thumbnail){
        return;
    }

    let selectedCardId = thumbnail.dataset.cardId;
    let selectedCardIndex = Array.from(SliderDom.querySelectorAll('.item'))
        .findIndex(item => item.dataset.cardId === selectedCardId);

    for(let index = 0; index < selectedCardIndex; index++){
        let currentSliderItems = SliderDom.querySelectorAll('.item');
        SliderDom.appendChild(currentSliderItems[0]);
    }

    if(selectedCardIndex > 0){
        carouselDom.classList.add('next');
    }

    updateSelectedCard();
    carouselDom.classList.add('card-expanded');
    clearTimeout(runTimeOut);
    runTimeOut = setTimeout(() => {
        carouselDom.classList.remove('next');
        carouselDom.classList.remove('prev');
    }, timeRunning);
    restartAutomaticTransition();
});

let runTimeOut;
let runNextAuto;

function restartAutomaticTransition(){
    clearTimeout(runNextAuto);
    runNextAuto = setTimeout(() => {
        nextDom.click();
    }, timeAutoNext);
}

restartAutomaticTransition();
updateSelectedCard();

function showSlider(type){
    let  SliderItemsDom = SliderDom.querySelectorAll('.carousel .list .item');

    carouselDom.classList.remove('card-expanded');
    
    if(type === 'next'){
        SliderDom.appendChild(SliderItemsDom[0]);
        carouselDom.classList.add('next');
    }else{
        SliderDom.prepend(SliderItemsDom[SliderItemsDom.length - 1]);
        carouselDom.classList.add('prev');
    }
    updateSelectedCard();
    clearTimeout(runTimeOut);
    runTimeOut = setTimeout(() => {
        carouselDom.classList.remove('next');
        carouselDom.classList.remove('prev');
    }, timeRunning);

    restartAutomaticTransition();
}
