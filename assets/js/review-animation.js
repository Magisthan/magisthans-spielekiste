const reviews = document.querySelectorAll(".review-stars");

const observer = new IntersectionObserver(entries => {

    entries.forEach(entry => {

        if (entry.isIntersecting) {

            entry.target.classList.add("animate");

            observer.unobserve(entry.target);

        }

    });

}, {

    threshold: 0.6

});

reviews.forEach(review => observer.observe(review));